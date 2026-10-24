import { ObjectIdPipe } from './object-id.pipe';
describe('ObjectId validation', () => {
  const pipe = new ObjectIdPipe();
  it('accepts MongoDB IDs', () =>
    expect(pipe.transform('507f1f77bcf86cd799439011')).toBe(
      '507f1f77bcf86cd799439011',
    ));
  it('rejects numeric and malformed IDs', () => {
    for (const id of ['1', 'bad', '507f1f77bcf86cd79943901z'])
      expect(() => pipe.transform(id)).toThrow('Invalid identifier');
  });
});
