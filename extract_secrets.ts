import { SecureElement } from 'secure-element-interface'

try {
    const sec_el = new SecureElement()
    let seed: string;
    let pword: string;

    try {
        seed = sec_el.getPublicKey(0).slice(0, 32).toString('hex')
    } catch (err) {
        sec_el.generateKeyPair(0)
        seed = sec_el.getPublicKey(0).slice(0, 32)
    }

    try {
        pword = sec_el.getPublicKey(1).toString('base64').slice(0, 32)
    } catch (err) {
        sec_el.generateKeyPair(1)
        pword = sec_el.getPublicKey(1).toString('base64').slice(0, 32)
    }

    if (seed && pword && seed.length && pword.length) console.log(`--seed=${seed} --password=${pword}`)
} catch (err) {

}
