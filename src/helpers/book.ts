import * as ISBN from 'node-isbn';
import {Book, BookIDArgs} from './types';
import { JolocomLib } from 'jolocom-lib';
import { IdentityWallet } from 'jolocom-lib/js/identityWallet/identityWallet';
import * as OHash from 'object-hash';
import { IVaultedKeyProvider } from 'jolocom-lib/js/vaultedKeyProvider/types';

const getBook = async (isbn: number): Promise<Book> => {
  const simp = await ISBN.resolve(isbn);
  return {title: simp.title,
          authors: simp.authors,
          isbn: isbn}
}

const hashBook = (bookArgs: BookIDArgs): string =>
  OHash(bookArgs);

const getBookVKP = (bookArgs: BookIDArgs, password: string): IVaultedKeyProvider =>
  new JolocomLib.KeyProvider(Buffer.from(hashBook(bookArgs)),
                             password
                            );

export const getBookId = async (isbn: number, pass: string, n?: number): Promise<IdentityWallet> =>
  JolocomLib.registries.jolocom.create().authenticate(getBookVKP(book,
                                                                 pass,
                                                                 salt
                                                                ),
                                                      {encryptionPass: pass,
                                                       derivationPath: JolocomLib.KeyTypes.jolocomIdentityKey}
                                                     );

export const anchorBook = async (book: Book, pass: string, salt?: Buffer): Promise<IdentityWallet> => {
  const vkp = getBookVKP(book, pass, salt);
  return JolocomLib.registries.jolocom.create().create(vkp,
                                                       pass
                                                      );
}

export const fuelBook = async (book: Book, pass: string, salt?: Buffer) =>
  JolocomLib.util.fuelKeyWithEther(getBookVKP(book, pass, salt)
                                   .getPublicKey({encryptionPass: pass,
                                                  derivationPath: JolocomLib.KeyTypes.ethereumKey}))
