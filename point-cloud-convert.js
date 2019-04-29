(function () {
    // supported will update once new point cloud format is supported
    var supported = [
        'ply2pcd',
        'pcd2ply',
        'asc2pcd',
        'pcd2asc',
        'asc2ply',
        'ply2asc'
    ];

    var doConvert = {};

    // input lines, return result with destLines if success
    doConvert.pcd2ply = function (lines) {
        // get info from pcd header (including the first 11 lines)
        var dataType = lines[10].split(' ')[1];  // get type of file (ascii or binary)
        // TODO support pcd binary file
        if (dataType === 'binary') {
            return {
                success: false,
                msg: 'binary pcd file is not supported so far.'
            }
        }
        var fields = lines[2].split(' ').slice(1);
        var sizes = lines[3].split(' ').slice(1);
        var types = lines[4].split(' ').slice(1);
        var counts = lines[5].split(' ').slice(1);
        var width = +lines[6].split(' ')[1];
        var height = +lines[7].split(' ')[1];
        var viewpoint = lines[8].split(' ').slice(1);
        var points = +lines[9].split(' ')[1];

        // varruct pcdObj
        var dataLines = lines.slice(11);
        var pcdObj = {};
        pcdObj.width = width;
        pcdObj.height = height;
        pcdObj.points = points;
        pcdObj.viewpoint = viewpoint;
        for (var i = 0; i < fields.length; ++i) {
            pcdObj[fields[i]] = dataLines.map(function(line) {
                return +line.split(' ')[i];
            });
            pcdObj[fields[i] + '-size'] = +sizes[i];
            pcdObj[fields[i] + '-type'] = types[i];
            pcdObj[fields[i] + '-count'] = +counts[i];
        }

        // unpack rgb or rgba
        if (pcdObj.rgb) {
            pcdObj.r = [];
            pcdObj.g = [];
            pcdObj.b = [];
            pcdObj.rgb.forEach(rgb => {
                var rgbValue = unpackPCDColor(rgb);
                // if rgb-type is F，rgbValue need to multiply by 2 (learn from practice)
                if (pcdObj['rgb-type'] === 'F') {
                    rgbValue = rgbValue.map(function(value) { return 2 * value; });
                }
                pcdObj.r.push(rgbValue[0]);
                pcdObj.g.push(rgbValue[1]);
                pcdObj.b.push(rgbValue[2]);
            });
        }
        if (pcdObj.rgba) {
            pcdObj.r = [];
            pcdObj.g = [];
            pcdObj.b = [];
            pcdObj.a = [];
            pcdObj.rgba.forEach(rgb => {
                var rgbValue = unpackPCDColor(rgb);
                // if rgb-type is F，rgbValue need to multiply by 2 (learn from practice)
                if (pcdObj['rgba-type'] === 'F') {
                    rgbValue = rgbValue.map(function(value) { return 2 * value; });
                }
                pcdObj.r.push(rgbValue[0]);
                pcdObj.g.push(rgbValue[1]);
                pcdObj.b.push(rgbValue[2]);
                // default a = 255
                pcdObj.a.push(255);
            });
        }

        // convert pcdObj to ply format
        var plyLines = [
            'ply',
            'format ascii 1.0',
            'element vertex ' + pcdObj.points,
            'property float x',
            'property float y',
            'property float z'
        ];
        if (pcdObj.r) {
            plyLines.push('property uchar red');
            plyLines.push('property uchar green');
            plyLines.push('property uchar blue');
            plyLines.push('property uchar alpha');
        }

        plyLines = plyLines.concat([
            'element camera 1',
            'property float view_px',
            'property float view_py',
            'property float view_pz',
            'property float x_axisx',
            'property float x_axisy',
            'property float x_axisz',
            'property float y_axisx',
            'property float y_axisy',
            'property float y_axisz',
            'property float z_axisx',
            'property float z_axisy',
            'property float z_axisz',
            'property float focal',
            'property float scalex',
            'property float scaley',
            'property float centerx',
            'property float centery',
            'property int viewportx',
            'property int viewporty',
            'property float k1',
            'property float k2'
        ]);

        plyLines.push('end_header');

        // vertexes
        for (var i = 0; i < pcdObj.points; ++i) {
            var xyz = [pcdObj.x[i], pcdObj.y[i], pcdObj.z[i]];
            var rgba = [];
            if (pcdObj.r) {
                rgba = [pcdObj.r[i], pcdObj.g[i], pcdObj.b[i], pcdObj.a ? pcdObj.a[i] : 255];
            }
            var vertexLine = xyz.concat(rgba).join(' ');
            plyLines.push(vertexLine);
        }
        // TODO camera params
        cameraParams = [0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 213, 1, 0, 0];
        cameraParams[17] = pcdObj.width;
        cameraParams[18] = pcdObj.height;
        plyLines.push(cameraParams.join(' '));
        plyLines.push('');  // this empty line is necessary

        return {
            success: true,
            lines: plyLines
        };
    }

    doConvert.ply2pcd = function (lines) {
        // ply format: ascii, binary_little_endian, binary_big_endian
        // TODO support ply binary file
        if (lines.slice(0, 5).join('').indexOf('binary') !== -1) {
            console.error('binary ply file is not supported.');
            return;
        }

        // get info from header
        var endHeaderInex = lines.indexOf('end_header');
        var headerLines = lines.slice(0, endHeaderInex);
        var dataLines = lines.slice(endHeaderInex + 1);

        var elementSplitorIndexes = [];
        headerLines.forEach((line, index) => {
            if (line.indexOf('element') !== -1) {
                elementSplitorIndexes.push(index);
            }
        });

        // carmeraFieldLines are optional
        var vertexFieldLines;
        var cameraFieldLines;
        var vertexFields;
        var cameraFields;
        if (elementSplitorIndexes.length === 2) {
            vertexFieldLines = headerLines.slice(elementSplitorIndexes[0] + 1, elementSplitorIndexes[1]);
            cameraFieldLines = headerLines.slice(elementSplitorIndexes[1] + 1);
            cameraFields = cameraFieldLines.map(function(line) { return line.split(' ')[2]; });
        } else {
            vertexFieldLines = headerLines.slice(elementSplitorIndexes[0] + 1);
        }
        
        vertexFields = vertexFieldLines.map(function(line) { return line.split(' ')[2]; });
        var points = +headerLines[elementSplitorIndexes[0]].split(' ')[2];

        // split dataLines
        var vertexDataLines = dataLines.slice(0, points + 1);
        var cameraDataLines = dataLines.slice(points);

        var plyObj = {};
        plyObj.points = points;
        plyObj.width = points;
        plyObj.height = 1;

        for (var i = 0; i < vertexFields.length; ++i) {
            plyObj[vertexFields[i][0]] = vertexDataLines.map(function(line) { return +line.split(' ')[i]; });
        }
        

        if (cameraDataLines.length !== 0) {
            for (var i = 0; i < cameraFields.length; ++i) {
                plyObj[cameraFields[i]] = cameraDataLines.map(function(line) { return +line.split(' ')[i]; });
            }

            plyObj.width = +cameraDataLines[0].split(' ')[17];
            plyObj.height = +cameraDataLines[0].split(' ')[18];
        }

        // convert plyObj to pcd format file
        var pcdLines = [
            '# .PCD v0.7 - Point Cloud Data file format',
            'VERSION 0.7'
        ];
        var midHeader = [];
        // TODO only rgb is considered, but rgba?
        if (plyObj.r) {
            midHeader = [
                'FIELDS x y z rgb',
                'SIZE 4 4 4 4',
                'TYPE F F F U',
                'COUNT 1 1 1 1'
            ];
        } else {
            midHeader = [
                'FIELDS x y z',
                'SIZE 4 4 4',
                'TYPE F F F',
                'COUNT 1 1 1'
            ];
        }

        pcdLines = pcdLines.concat(midHeader);
        pcdLines.push('WIDTH ' + plyObj.width);
        pcdLines.push('HEIGHT ' + plyObj.height);
        // TODO viewport is a constant
        pcdLines.push('VIEWPOINT 0 0 0 1 0 0 0');
        pcdLines.push('POINTS ' + plyObj.points);
        pcdLines.push('DATA ascii');

        for (var i = 0; i < plyObj.points; ++i) {
            var lineItems = [plyObj.x[i], plyObj.y[i], plyObj.z[i]];
            if (plyObj.r) {
                lineItems.push(packPCDColor(plyObj.r[i], plyObj.g[i], plyObj.b[i]));
            }
            pcdLines.push(lineItems.join(' '));
        }
        pcdLines.push('');

        return {
            success: true,
            lines: pcdLines
        };

    }

    doConvert.asc2pcd = function (lines) {
        lines = lines.filter(function(line) {
            if (line.indexOf('#') !== -1) {
                return false;
            }
            return true;
        });

        var pcdLines = [
            '# .PCD v0.7 - Point Cloud Data file format',
            'VERSION 0.7'
        ];

        // number of element for each line
        var fieldsCnt = lines[0].split(' ').length;

        var midHeader = [];
        if (fieldsCnt > 4) {  // xyz, rgb...
            midHeader = [
                'FIELDS x y z rgb',
                'SIZE 4 4 4 4',
                'TYPE F F F U',
                'COUNT 1 1 1 1'
            ];
        } else {  // only xyz
            midHeader = [
                'FIELDS x y z',
                'SIZE 4 4 4',
                'TYPE F F F',
                'COUNT 1 1 1'
            ];
        }

        pcdLines = pcdLines.concat(midHeader);

        // unorganized point cloud
        var width = lines.length;
        var height = 1;
        var points = width * height;


        pcdLines.push('WIDTH ' + width);
        pcdLines.push('HEIGHT ' + height);
        // TODO viewport is a constant
        pcdLines.push('VIEWPOINT 0 0 0 1 0 0 0');
        pcdLines.push('POINTS ' + points);
        pcdLines.push('DATA ascii');

        for (var i = 0; i < points; ++i) {
            var items = lines[i].split(' ');
            var lineItems = [+items[0], +items[1], +items[2]];
            if (fieldsCnt > 4) {
                var r = +items[3];
                var g = +items[4];
                var b = +items[5];

                if (r <= 1 && r >= 0) r = Math.floor(r * 255);
                if (g <= 1 && g >= 0) g = Math.floor(g * 255);
                if (b <= 1 && b >= 0) b = Math.floor(b * 255);

                lineItems.push(packPCDColor(r, g, b));
            }
            pcdLines.push(lineItems.join(' '));
        }
        pcdLines.push('');

        return {
            success: true,
            lines: pcdLines
        };
    }

    doConvert.pcd2asc = function (lines) {
        // get info from header
        var dataType = lines[10].split(' ')[1];
        if (dataType === 'binary') {
            return {
                success: false,
                msg: 'binary pcd file is not supported.'
            }
        }

        var points = +lines[9].split(' ')[1];

        var ascLines = [];
        // TODO to be more precise
        var fields = lines[2].split(' ').slice(1);
        for (var i = 0; i < points; ++i) {
            var lineItems = lines[i + 11].split(' ');
            var ascLineItems = [+lineItems[0], +lineItems[1], +lineItems[2]];
            if (fields.length > 3) {
                ascLineItems = ascLineItems.concat(
                    unpackPCDColor(+lineItems[3]).map(function(value) { return (value / 255).toFixed(3); })
                );
            }
            ascLines.push(ascLineItems.join(' '));
        }
        ascLines.push('');

        return {
            success: true,
            lines: ascLines
        };
    }

    doConvert.asc2ply = function (lines) {
        // indirect conversion
        var result = doConvert.asc2pcd(lines);
        if (!result.success) {
            return {
                success: false,
                msg: 'A error occurred in asc2ply period'
            }
        }
        return doConvert.pcd2ply(result.lines);
    }

    doConvert.ply2asc = function (lines) {
        // TODO 转换有问题，没有颜色，最后有 NaN
        var result = doConvert.ply2pcd(lines);
        if (!result.success) {
            return {
                success: false,
                msg: 'A error occurred in pcd2asc period'
            }
        }
        return doConvert.pcd2asc(result.lines);
    }

    // tool function 
    function packPCDColor(r, g, b) {
        var rgb = (r << 16) | (g << 8) | b;
        return rgb;
    }

    function unpackPCDColor(rgb) {
        var r = (rgb >> 16) & 0x0000ff;
        var g = (rgb >> 8) & 0x0000ff;
        var b = (rgb) & 0x0000ff;
        return [r, g, b];
    }

    /**
     * 
     * @param {string} input input string
     * @param {string} conversionType conversion type, eg. pcd2ply, ply2pcd
     */
    var pointCloudConvert = function(input, conversionType) {
        if (supported.indexOf(conversionType) === -1) {
            throw new Error('can not support conversion type: ' + conversionType);
        }
        if (typeof input !== 'string') {
            throw new Error('input must be a string');
        }
        var lines = input.split('\n').map(function(line) { return line.trim(); });
        lines = lines.filter(function(line) { return line.length !== 0; });

        var result = doConvert[conversionType](lines);
        if (result.success) {
            return result.lines.join('\n');
        } else {
            throw new Error('conversion ' + conversionType + ' failed: ' + result.msg);
        }
    }

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = pointCloudConvert;
    }

    if (typeof window !== 'undefined') {
        window.pointCloudConvert = pointCloudConvert;
    }

})();
