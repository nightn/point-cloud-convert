#!/usr/bin/env node
var fs = require('fs');
var pointCloudConvert = require('./point-cloud-convert');
var program = require('commander');

var version = '0.0.3';

/**
 * 
 * @param {string} srcFormat source format
 * @param {string} destFormat destination format
 * @param {string} srcFilename source filename
 * @param {string} destFilename destination format
 */
function convert(conversionType, srcFilename, destFilename) {
    var input = fs.readFileSync(srcFilename).toString();
    console.log('converting ' + srcFilename + '...');
    var output = pointCloudConvert(input, conversionType);
    fs.writeFileSync(destFilename, output);
    console.log('Success: convert ' + srcFilename + ' to ' + destFilename + ' successfully!');
}

function exists(path){  
    return fs.existsSync(path) || path.existsSync(path);  
}

function isFile(path){  
    return exists(path) && fs.statSync(path).isFile();  
}

function isDir(path){  
    return exists(path) && fs.statSync(path).isDirectory();  
}

function main() {
    program
        .usage('[options] <src> <dest>')
        .version(version, '-v, --version')
        //   .option('-src, --source [source]', 'set source file or source directory')
        //   .option('-dest, --destination [destination]', 'set destination file or destination directory')
        .option('-t, --type <type>', 'set format conversion type, eg. pcd2ply, it will be inferred if not set')
        .option('-d, --directory', 'convert all files from one directory to another');

    program.on('--help', function () {
        console.log('');
        console.log('Supported all conversion type among ply, pcd and asc, eg. pcd2ply, asc2pcd');
        console.log('');
        console.log('Examples:');
        console.log('  $ point-cloud-convert demo.pcd demo.ply -t pcd2ply');
        console.log('  $ point-cloue-convert demo.pcd demo.ply');
        console.log('  $ point-cloud-convert ./input ./output -t ply2pcd -d'); 
    });

    program.parse(process.argv);

    // if (program.help) {
    //     program.help();
    // }

    var src = program.args[0];
    var dest = program.args[1];
    var type = program.type;

    if (!program.args.length || !src || !dest) program.help();

    if (!program.directory) { // for single file
        // if src is dir
        if (isDir(src)) {
            console.log(src + ' is a directory, do you forget to add option -d ?');
            return;
        }

        var destItems = dest.split('/');
        destItems.pop();
        var destDir = destItems.join('/');

        // if type is not defined
        if (!type) {
            var srcItems = src.split('.');
            var srcSuffix = srcItems[srcItems.length - 1];
            var destItems = dest.split('.');
            var destSuffix = destItems[destItems.length - 1];
            type = srcSuffix + '2' + destSuffix;
        }

        if (!fs.existsSync(destDir)) {
            fs.mkdirSync(destDir);
        }
        convert(type, src, dest);

    } else {  // for directory
        if (!fs.existsSync(src)) {
            console.error('There is no directory ' + src);
            return;
        }
        // 如果 dest 目录不存在，则创建
        if (!fs.existsSync(dest)) {
            fs.mkdirSync(dest);
        }

        var files = fs.readdirSync(src);

        var srcSuffix = type.split('2')[0];
        var destSuffix = type.split('2')[1];

        var filesToConvert = files.filter(filename => {
            var filenameItems = filename.split('.');
            if (filenameItems[filenameItems.length - 1] === srcSuffix) return true;
            return false;
        });

        // 如果 dest 目录不存在，则创建
        if (!fs.existsSync(dest)) {
            fs.mkdirSync(dest);
        }

        filesToConvert.forEach((filename, index) => {
            if (src[src.length - 1] !== '/' && src[src.length - 1] !== '\\') src += '/';
            if (dest[dest.length - 1] !== '/' && dest[dest.length - 1] !== '\\') dest += '/';
            var srcFullFilename = src + filename;
            var filenameItems = filename.split('.');
            filenameItems[filenameItems.length - 1] = destSuffix;
            var destFullFilename = dest + filenameItems.join('.');
            convert(type, srcFullFilename, destFullFilename);
            console.log(`${index + 1}/${filesToConvert.length} files done`);
            console.log('');
        });

    }
}

main();
