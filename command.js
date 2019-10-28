var Engine = require('@rakov/minus-command');
var myfs = require('@rakov/fs-promise');
var promisify = require('@rakov/promisify');

function clearTMP(path, recursive){
	return myfs.readdir(path).then((files)=>(promisify.serialMap(files, (filename)=>{
		var filepath = path+'/'+filename;
		return myfs.stat(filepath).then((stats)=>{
			if(stats.isDirectory() && recursive){
				return clearTMP(filepath, recursive);
			}
			else if(stats.isFile() && /\.log$|\.aux$|\.synctex\.gz$/.test(filepath)){
				return myfs.unlink(filepath);
			}
		})
	})))
}

function makeView(up){
	return `
\documentclass[a4paper]{article}
\usepackage{steal}
\steal{${up}}{configs/article}

\begin{document}

\stealcurrent

\end{document}	
`
}

var eng = new Engine({
	'-make-folder':function(){
		var path = this.pop();
		return myfs.createFolder(path).then(()=>(myfs.rename(path+'.tex', path+'/index.tex')));
	},
	'-make-view':function(){
		var path = this.pop();
		var count = path.split(/\\|\//g).length;
		var up = '../'.repeat(count);
		var code = '\
\\documentclass[a4paper]{article}\r\n\
\\usepackage{import}\r\n\
\\subimport{' + up + '}{configs/article}\r\n\
\r\n\
\\begin{document}\r\n\
\r\n\
\\stealcurrent\r\n\
\r\n\
\\end{document}';
		return myfs.writeFile(path+'/view.tex', code);
	},
	'-clear-tmp':function(){
		var path = this.pop();
		clearTMP(path, true);
	}
});

var env = eng.makeEnv();

env.runArgv();