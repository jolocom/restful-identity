"use strict";
exports.__esModule = true;
var secure_element_1 = require("./dist/utils/secure-element");
var keys = secure_element_1.readKeys();
if (keys)
    console.log("--seed=" + keys.seed + " --password=" + keys.password);
