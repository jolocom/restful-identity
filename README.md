# restful-identity
This package implements a Jolocom Self Sovereign Identity as a Node RPC server (the name stuck).

## Installation
### NPM
It can be easily installed via `npm install -g restful-identity`.

### Git
It can also be installed via git with `git clone https://github.com/jolocom/restful-identity` and `yarn install` and `yarn build`

## Usage
If installed globally via npm, it can be run simply with `$ restful-identity`.
Running from the repo is easy with `$ ./main.js` or `$ node main.js`
If using a secure hardware element, this program MUST be used with `sudo` or as root in order to enable hardware interfacing.

### Configuration
The server takes two kinds of configuration: cli and ini format.
By default it will look for a `/etc/jolocom.conf` file. This can be changed with the `--file=/some/path` command line argument.
Command line arguments will override configuration file arguments if both are present and conflict.

##### Identity
These arguments corrospond to the unique Identity of the server. They should be kept secret.
They consist of:
- seed: a 64 character (32 byte) hexadecimal string
- password: any string

Keep in mind that if you are using this server with a compatible secure hardware element, using the identity configuration will override the hardware element, and so should not be used.

The default arguments if none are provided are:
- seed: aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
- password: secret

##### Backend
These arguments represent the Self-Sovereign Identity backend that the server will interact with.
This is a complex topic, but think of it as a database that it must access.
The arguments consist of:
- endpoint: A URL
- contract: An Ethereum-like contract address

The default backend used is the Jolocom SSI system.

##### Port
This is simply the port that the server will listen on.
The default is 3000

#### File-based Configuration
Here is an example configuration file with every option (they are all optional):
```
[identity]
seed = B491A4D2A93281420DE9D799943DA73C3BCEE08FAD6EACD8E8A69BBE77C6D110
password = some_secret_password

[backend]
endpoint = https://some.chain.interface/endpoint
contract = 0x50ee3ad2042a16c9a9b75b447947c7a7d2c53e29

[deployment]
port = 3000
```

#### Command Line Configuration
Any of the fields in the file configuration can also be used on the command line:
```
$ restful-identity --port=3000 --endpoint=https://some.chain.interface/endpoint --contract=0x50ee3ad2042a16c9a9b75b447947c7a7d2c53e29
```
Note that the grouped configs (backend and identity) MUST have BOTH arguments in order to override the file.


### API
API Documentation can be found by running the server and visiting the `/documentation/` route.
Swagger descriptions can also be found at `/documentation/json` and `/documentation/yaml`.
