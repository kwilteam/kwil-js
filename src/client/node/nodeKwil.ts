import Client from '../../api_client/client';
import { Config } from '../../api_client/config';
import { AuthSuccess } from '../../core/auth';
import { EnvironmentType } from '../../core/enums';
import { KwilSigner } from '../../core/kwilSigner';
import { GenericResponse } from '../../core/resreq';
import { Kwil } from '../kwil';

export class NodeKwil extends Kwil<EnvironmentType.NODE> {
  private config: Config;

  constructor(opts: Config) {
    super(opts);
    this.config = opts;
  }

  public async authenticate(signer: KwilSigner): Promise<GenericResponse<AuthSuccess<EnvironmentType.NODE>>> {
    return await super.authenticate(signer);
  }

  public setCookie(cookie: string): void {
    this.client = new Client(this.config, cookie);
  }
}
