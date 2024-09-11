import fs from 'node:fs';
import path from 'node:path';
import packageJson from './package.json';

const cwd = import.meta.dirname;

const buildDir = path.join(cwd, 'build');

const rmdirSync = (dir: string) => {
  if (fs.existsSync(dir)) {
    fs.readdirSync(dir).forEach((file) => {
      const curPath = path.join(dir, file);
      if (fs.lstatSync(curPath).isDirectory()) {
        rmdirSync(curPath);
      } else {
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(dir);
  }
};

function cpSync(from: string, to: string) {
  fs.mkdirSync(to);
  fs.readdirSync(from).forEach((element) => {
    if (fs.lstatSync(path.join(from, element)).isFile()) {
      fs.copyFileSync(path.join(from, element), path.join(to, element));
    } else {
      cpSync(path.join(from, element), path.join(to, element));
    }
  });
}

rmdirSync(buildDir);
fs.mkdirSync(buildDir);
cpSync(`${cwd}/src/sql`, `${cwd}/build/sql`);

fs.writeFileSync(
  path.join(buildDir, 'package.json'),
  JSON.stringify(
    {
      name: packageJson.name,
      version: packageJson.version,
      type: packageJson.type,
      dependencies: packageJson.dependencies,
    },
    null,
    2
  )
);
