import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import { join } from 'path';
import { config } from '../config';

const USER_PROTO_PATH = join(__dirname, '..', 'proto', 'user.proto');

const userPackageDef = protoLoader.loadSync(USER_PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const userProto: any = grpc.loadPackageDefinition(userPackageDef);

const client = new userProto.user.UserService(
  `${config.userServiceHost}:${config.userGrpcPort}`,
  grpc.credentials.createInsecure(),
);

export interface VerifyTokenResult {
  valid: boolean;
  userId: number;
  email: string;
  role: string;
}

export interface UserResult {
  id: number;
  email: string;
  role: string;
}

export function verifyToken(token: string): Promise<VerifyTokenResult> {
  return new Promise((resolve, reject) => {
    client.VerifyToken({ token }, (err: any, response: any) => {
      if (err) return reject(err);
      resolve({
        valid: response.valid,
        userId: response.user_id,
        email: response.email,
        role: response.role,
      });
    });
  });
}

export function getUser(userId: number): Promise<UserResult> {
  return new Promise((resolve, reject) => {
    client.GetUser({ user_id: userId }, (err: any, response: any) => {
      if (err) return reject(err);
      resolve({
        id: response.id,
        email: response.email,
        role: response.role,
      });
    });
  });
}
