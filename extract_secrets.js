"use strict";
exports.__esModule = true;
var secure_element_interface_1 = require("secure-element-interface");
try {
    var sec_el = new secure_element_interface_1.SecureElement();
    var seed = void 0;
    var pword = void 0;
    try {
        seed = sec_el.getPublicKey(0).slice(0, 32).toString('hex');
    }
    catch (err) {
        sec_el.generateKeyPair(0);
        seed = sec_el.getPublicKey(0).slice(0, 32);
    }
    try {
        pword = sec_el.getPublicKey(1).toString('base64').slice(0, 32);
    }
    catch (err) {
        sec_el.generateKeyPair(1);
        pword = sec_el.getPublicKey(1).toString('base64').slice(0, 32);
    }
    if (seed && pword && seed.length && pword.length)
        console.log("--seed=" + seed + " --password=" + pword);
}
catch (err) {
}
