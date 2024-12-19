export enum ProvidersName {
  DATA_SOURCE = 'DATA_SOURCE',
}

export const jwtConstants = {
  secret: process.env.JWT_SECRET,
  expire: '7d',
};
