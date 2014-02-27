/*
 * grunt-html2jsonp
 *
 * Copyright (c) 2014 yqt
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function(grunt) {

  var path = require('path');

  var escapeContent = function(content, quoteChar, indentString, strip) {
    var bsRegexp = new RegExp('\\\\', 'g');
    var quoteRegexp = new RegExp('\\' + quoteChar, 'g');
    var nlRegexp = strip ? new RegExp('[ \t]*\r?\n[ \t]*', 'g') : new RegExp('\r?\n', 'g');
    var nlReplace = strip ? '' : ('\\n' + quoteChar + ' +\n' + indentString + indentString + quoteChar);

    return content.replace(bsRegexp, '\\\\').replace(quoteRegexp, '\\' + quoteChar).replace(nlRegexp, nlReplace);
  };

  // convert Windows file separator URL path separator
  var normalizePath = function(p) {
    if ( path.sep !== '/' ) {
      p = p.replace(/\\/g, '/');
    }
    return p;
  };

  // Warn on and remove invalid source files (if nonull was set).
  var existsFilter = function(filepath) {

    if (!grunt.file.exists(filepath)) {
      grunt.log.warn('Source file "' + filepath + '" not found.');
      return false;
    } else {
      return true;
    }
  };

  var getFilename = function(filepath) {
    var normalizedPath = normalizePath(filepath);
    return normalizedPath.replace(/^.+?\/([^\/]+?)(\.[^\.\/]*?)?$/gi, "$1");
  };

  var changeExtensionName = function(filepath, extName) {
    var normalizedPath = normalizePath(filepath);
    return normalizedPath.replace(/.+\./, function (match) {
      return match ? match + extName : normalizedPath + '.' + extName;
    });
  };

  // compile a template to JSONP style
  var compileTemplate = function(filepath, functionName, quoteChar, indentString, strip) {

    var content = escapeContent(grunt.file.read(filepath), quoteChar, indentString, strip);
    var doubleIndent = indentString + indentString;

    var callback = functionName + '(\n' +
      indentString + quoteChar + content +
      quoteChar + '\n)';

    return callback;
  };

  grunt.registerMultiTask('html2jsonp', 'Compiles html templates to JSONP style.', function() {

    var options = this.options({
      quoteChar: "'",
      fileHeaderString: '',
      fileFooterString: '',
      indentString: '  ',
      target: 'js',
      functionName: 'jsonpCallback',
      strip: false
    });

    // generate a separate module
    this.files.forEach(function(f) {

      // f.dest must be a string or write will fail
      f.src.filter(existsFilter).map(function(filepath) {
        var content, dest,
          fileHeader = options.fileHeaderString !== '' ? options.fileHeaderString + '\n' : '',
          fileFooter = options.fileFooterString !== '' ? options.fileFooterString + '\n' : '';
        
        if (options.target === 'js') {
          content = compileTemplate(filepath, options.functionName, options.quoteChar, options.indentString, options.strip);
        } else {
          grunt.fail.fatal('Unknow target "' + options.target + '" specified');
        }
        content = fileHeader + content + fileFooter;

        if (grunt.file.isDir(f.dest)) {
          dest = f.dest + '/' + getFilename(filepath) + '.' + options.target;
        } else {
          dest = changeExtensionName(filepath, options.target);
        }

        grunt.file.write(dest, grunt.util.normalizelf(content));

      });
    });
    //Just have one output, so if we making thirty files it only does one line
    grunt.log.writeln("Successfully converted "+(""+this.files.length).green +
                      " html templates to " + options.target + ".");
  });
};
