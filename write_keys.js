"use strict";
exports.__esModule = true;
var secure_element_1 = require("./src/utils/secure-element");
var ini = require("ini");
var fs = require("fs");
var pa = require("minimist");
var fileName = pa(process.argv.slice(2), {
    string: ['file']
}).file || '/etc/jolocom.conf';
var keys = secure_element_1.readKeys();
if (keys) {
    var file = ini.parse(fileName);
    file.identity.seed = keys.seed;
    file.identity.password = keys.password;
    fs.writeFileSync(fileName, ini.stringify(file));
}
