import { BlobServiceClient } from '@azure/storage-blob';
import * as core from '@actions/core';
import { promises as fs } from 'fs';
import { relative, dirname, join } from 'path';
import { connect } from 'http2';

export async function download(
  connectionString: string,
  name: string,
  path: string,
  container: string,
) {
  core.info(`connection string: "${connectionString}" `);
  const serviceClient = await BlobServiceClient.fromConnectionString(
    connectionString,
  );

  // Create container if necessary
  core.info(`Get a container "${container}" ...`);
  const containerClient = await serviceClient.getContainerClient(container);

  // Download all
  for await (const blob of containerClient.listBlobsFlat()) {
    if (!blob.name.startsWith(name + '/')) {
      continue;
    }
    const dst = join(path || name, relative(name, blob.name));
    core.info(`Downloading ${blob.name} to ${dst} ...`);
    await fs.mkdir(dirname(dst), { recursive: true });
    const blockClient = await containerClient.getBlockBlobClient(blob.name);
    await blockClient.downloadToFile(dst);
  }
}
