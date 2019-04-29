# point-cloud-convert

[point-cloud-convert](https://github.com/nightn/point-cloud-convert) is a simple JavaScript tool converting point cloud file from one format to another, which can be used as both of JavaScript API (in a browser or in Node.js) and CLI.

At present, the following convertions are supported.

- `pcd` <-> `ply`
- `asc` <-> `pcd`
- `asc` <-> `ply`

You can use [CloudViewer](https://github.com/nightn/CloudViewer) to visualize point cloud files with different format.

## Installation

In a browser:

```html
<script src="point-cloud-convert.js"></script>
```

In Node.js:

If you want `point-cloud-convert` to work as **API** for your JavaScript project, run the code:

```shell
$ npm install --save point-cloud-convert
```

If you want `point-cloud-convert` to work as **CLI** to convert your local files, run the code:

```shell
$ npm install --global point-cloud-convert
```

## How to use

### (1) use point-cloud-convert as API

There is only one function named `pointCloudConvert`，which takes **two parameters**, the first is an input string, and the second is a conversion type string, and return a output string. conversion type can be one of the following strings so far:

`pcd2ply`, `pcd2asc`, `ply2pcd`, `ply2asc`, `asc2pcd`, `asc2ply` .

in a browser:

```html
<script src="point-cloud-convert.js"></script>
<script>
	// inputStr has been loaded
    var conversionType = 'ply2pcd';  // convert ply to pcd
    var outputStr = pointCloudConvert(inputStr, conversionType);
</script>
```

in Node.js:

```js
const pointCloudConvert = require('point-cloud-convert');

// inputStr has been loaded
let conversionType = 'ply2pcd';  // convert ply to pcd
let outputStr = pointCloudConvert(inputStr, conversionType);
```

### (2) use point-cloud-convert as CLI

`point-cloud-convert` can be also used as CLI. it is really convenient and fase to convert point cloud file from one format to another, All you need to do is installing the `Node.js` and `point-cloud-convert` package in global. If you have already installed `Node.js` , then run the following code to install `point-cloud-convert` globally.

```shell
$ npm install --global point-cloud-convert
```

The help doc:

```shell
Usage: point-cloud-convert [options] <src> <dest>

Options:
  -v, --version      output the version number
  -t, --type <type>  set format conversion type, eg. pcd2ply, it will be inferred if not set
  -d, --directory    convert all files from one directory to another
  -h, --help         output usage information

Supported all conversion type among ply, pcd and asc, eg. pcd2ply, asc2pcd

Examples:
  $ point-cloud-convert demo.pcd demo.ply -t pcd2ply
  $ point-cloue-convert demo.pcd demo.ply
  $ point-cloud-convert ./input ./output -t ply2pcd -d
```

Examples:

- Convert `demo.pcd` to `demo.ply` . Option `-t pcd2ply` specifies the conversion type.

  ```shell
  $ point-cloud-convert demo.pcd demo.ply -t pcd2ply
  ```

  This command will convert `demo.pcd` to `demo.ply`.

- Indeed, if you forget type `-t` option, the conversion type will be inferred from the source filename `demo.pcd` and destination filename `demo.ply`. I think it is more convenient for converting a single file.

  ```shell
  $ point-cloud-convert demo.pcd demo.ply
  ```

- Converting directory is also supported by using `-d` option. In the following example, `./input` is source directory, `./output` is destination directory. But in this case, `-t` option is necessary, because conversion type can not be inferred any more. Again, do not forget `-d` option when converting point cloud directory.

  ```shell
  $ point-cloud-convert ./input ./output -t ply2pcd -d
  ```

  This command will convert all `ply` files in `./input` directory to `pcd` files in `./output` directory.

## TODO

- [ ] Create a simple browser demo to show basic function of `point-cloud-convert`.
- [ ] Add `README-zh.md`.
- [ ] Support point cloud  format `wrl`.
- [ ] Support converting directory recursively (using `-r` option).

## Bugs

Please use the [Github issue tracker](https://github.com/nightn/point-cloud-convert/issues) for all bugs and feature requests.

