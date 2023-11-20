import { Config } from '../../api_client/config';
import { AuthSuccess } from '../../core/auth';
import { EnvironmentType } from '../../core/enums';
import { KwilSigner } from '../../core/kwilSigner';
import { GenericResponse } from '../../core/resreq';
import { Kwil } from '../kwil';

export class WebKwil extends Kwil<EnvironmentType.BROWSER> {
  constructor(opts: Config) {
    super(opts);
  }

  async authenticate(signer: KwilSigner): Promise<GenericResponse<AuthSuccess<EnvironmentType.BROWSER>>> {
    return super.authenticate(signer);
  }
}
