import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';

chai.should();
chai.use(chaiAsPromised);

global.expect = chai.expect;
global.assert = chai.assert;
