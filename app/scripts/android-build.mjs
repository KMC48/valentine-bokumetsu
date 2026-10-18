import { spawnSync } from 'node:child_process';
import { existsSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const app = fileURLToPath(new URL('../', import.meta.url));
const android = path.join(app, 'android');
const windows = process.platform === 'win32';
const python = windows ? 'python' : 'python3';
const aab = 'android/app/build/outputs/bundle/release/app-release.aab';

function run(command, args, cwd = app, shell = false) {
  const result = spawnSync(command, args, { cwd, shell, stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${command} failed (exit ${result.status})`);
}

try {
  const mode = process.argv[2];
  if (!['release', 'unsigned', 'debug', 'verify', 'aab', 'test'].includes(mode)) {
    throw new Error('Usage: android-build.mjs release|unsigned|debug|verify|aab|test');
  }
  if (mode === 'test') {
    run(python, ['-m', 'unittest', 'discover', '-s', 'scripts', '-p', 'test_*.py']);
  } else if (mode === 'verify' || mode === 'aab') {
    run(python, ['scripts/verify_android_content.py', ...(mode === 'aab' ? ['--aab', process.argv[3] ?? aab] : [])]);
  } else {
    if (mode === 'release' && !existsSync(path.join(android, 'keystore.properties'))) {
      throw new Error('署名情報がありません。公開用は android/keystore.properties が必要です。鍵なしの検証は npm run android:unsigned を使ってください。');
    }
    run(python, ['--version']);
    // npmの実行ファイルをNode経由で呼ぶため、Windowsでもシェルの引用符に依存しない。
    run(process.execPath, [process.env.npm_execpath, 'run', 'android:prepare']);
    const task = mode === 'debug' ? ':app:assembleDebug' : ':app:bundleRelease';
    // 失敗後に前回のAABを今回の成果物と誤認しないよう、対象出力だけを除去する。
    if (mode !== 'debug') rmSync(path.join(app, aab), { force: true });
    const args = [task, '--no-daemon', '--console=plain', ...(mode === 'unsigned' ? ['-PunsignedRelease=true'] : [])];
    if (windows) run('.\\gradlew.bat', args, android, true);
    else run('sh', ['./gradlew', ...args], android);
    if (mode !== 'debug') {
      run(python, ['scripts/verify_android_content.py', '--aab', aab, `--expect-${mode === 'release' ? 'signed' : 'unsigned'}`]);
      if (mode === 'release') run('jarsigner', ['-verify', aab]);
      console.log(mode === 'release'
        ? '署名済みAABの内容検証が完了しました。アップロード鍵の証明書とPlay Consoleの登録内容は別途照合してください。'
        : '未署名AABの内容検証が完了しました。このAABはGoogle Playへ提出できません。');
    }
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
