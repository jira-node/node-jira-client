import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';

global.should = chai.should();
chai.use(chaiAsPromised);

global.expect = chai.expect;
global.assert = chai.assert;
