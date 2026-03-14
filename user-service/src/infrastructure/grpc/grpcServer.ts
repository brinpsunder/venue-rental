import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import path from 'path';
import logger from '../../logger';
import VerifyToken from '../../use-cases/VerifyToken';
import GetUser from '../../use-cases/GetUser';
import PostgresUserRepository from '../database/PostgresUserRepository';

const PROTO_PATH = path.join(__dirname, 'user.proto');

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const userProto = grpc.loadPackageDefinition(packageDefinition) as any;

const userRepository = new PostgresUserRepository();
const verifyToken = new VerifyToken();
const getUser = new GetUser(userRepository);

function verifyTokenHandler(call: grpc.ServerUnaryCall<any, any>, callback: grpc.sendUnaryData<any>): void {
  const result = verifyToken.execute(call.request.token);
  callback(null, {
    valid: result.valid,
    user_id: result.userId,
    email: result.email,
    role: result.role,
  });
}

async function getUserHandler(call: grpc.ServerUnaryCall<any, any>, callback: grpc.sendUnaryData<any>): Promise<void> {
  try {
    const user = await getUser.execute(call.request.user_id);
    callback(null, { id: user.id, email: user.email, role: user.role });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    callback({ code: grpc.status.NOT_FOUND, message });
  }
}

function startGrpcServer(): void {
  const server = new grpc.Server();
  server.addService(userProto.user.UserService.service, {
    verifyToken: verifyTokenHandler,
    getUser: getUserHandler,
  });

  const GRPC_PORT = process.env.GRPC_PORT ?? '50051';
  server.bindAsync(
    `0.0.0.0:${GRPC_PORT}`,
    grpc.ServerCredentials.createInsecure(),
    (err: Error | null, port: number) => {
      if (err) {
        logger.error('Failed to start gRPC server', { error: err.message });
        return;
      }
      logger.info(`user-service gRPC server running on port ${port}`);
    }
  );
}

export default startGrpcServer;
