import { S3Client, NoSuchKey, PutObjectCommand, GetObjectCommand, ObjectCannedACL, HeadObjectCommand, NotFound } from '@aws-sdk/client-s3'
import crypto from 'crypto'
import { Readable } from 'stream'
import { Provider } from '../../../uploads/provider'
import { NodeHttpHandler } from '@smithy/node-http-handler'
import { Agent } from 'node:https'

interface AwsProviderOptions {
  credentials: {
    accessKeyId: string,
    secretAccessKey: string
  }
  bucketName: string;
  region: string;
}

export default class AwsProvider implements Provider {
  private client: S3Client
  private bucketName: string
  private region: string

  constructor (_options: AwsProviderOptions) {
    const options: Required<AwsProviderOptions> = {
      credentials: {
        accessKeyId: _options.credentials.accessKeyId || process.env.RCTF_AWS_ACCESS_KEY_ID as string,
        secretAccessKey: _options.credentials.secretAccessKey || process.env.RCTF_AWS_SECRET_ACCESS_KEY as string
      },
      bucketName: _options.bucketName || process.env.RCTF_AWS_BUCKET as string,
      region: _options.region || process.env.RCTF_AWS_REGION as string
    }
    // TODO: validate that all options are indeed provided

    this.client = new S3Client({
      region: options.region,
      credentials: {
        accessKeyId: options.credentials.accessKeyId,
        secretAccessKey: options.credentials.secretAccessKey
      },
      requestHandler: new NodeHttpHandler({
        httpsAgent: new Agent({
          maxSockets: 500,

          // keepAlive is a default from AWS SDK. We want to preserve this for
          // performance reasons.
          keepAlive: true,
          keepAliveMsecs: 1000,
          timeout: 5000
        }),
        connectionTimeout: 1000,
        requestTimeout: 5000
      })
    })

    this.bucketName = options.bucketName
    this.region = options.region
  }

  private getAwsFile = async (sha256: string, name: string): Promise<Readable | null> => {
    const key = `uploads/${sha256}/${name}`
    const getObjectCommand = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key
    })
    try {
      const fileRes = await this.client.send(getObjectCommand)
      return fileRes.Body as Readable
    } catch (error) {
      if (error instanceof NoSuchKey) {
        return null
      } else {
        throw new Error(`Unknown AWS error occurred: ${(error as Error).toString()})`)
      }
    }
  }

  private CheckAwsFile = async (sha256: string, name: string): Promise<boolean> => {
    const key = `uploads/${sha256}/${name}`
    const headObjectCommand = new HeadObjectCommand({
      Bucket: this.bucketName,
      Key: key
    })
    try {
      await this.client.send(headObjectCommand)
      return true
    } catch (error) {
      if (error instanceof NotFound) {
        return false
      } else {
        throw error
      }
    }
  }

  upload = async (data: Buffer, name: string): Promise<string> => {
    const hash = crypto.createHash('sha256').update(data).digest('hex')
    const key = `uploads/${hash}/${name}`
    const fileExists = await this.CheckAwsFile(hash, name)
    if (!fileExists) {
      const putObjectCommand = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: data,
        ACL: ObjectCannedACL.public_read
      })
      await this.client.send(putObjectCommand)

      // await file.save(data, {
      //   public: true,
      //   resumable: false,
      //   metadata: {
      //     contentDisposition: 'download'
      //   }
      // })
    }
    return this.toUrl(hash, name)
  }

  private toUrl (sha256: string, name: string): string {
    return `https://${this.bucketName}.s3.${this.region}.amazonaws.com/uploads/${sha256}/${encodeURIComponent(name)}`
  }

  async getUrl (sha256: string, name: string): Promise<string|null> {
    const file = await this.getAwsFile(sha256, name)

    if (file === null) {
      return null
    }
    return this.toUrl(sha256, name)
  }
}
