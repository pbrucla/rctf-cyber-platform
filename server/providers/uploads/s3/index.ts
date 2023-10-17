import { S3Client, NotFound, PutObjectCommand, GetObjectCommand, ObjectCannedACL } from '@aws-sdk/client-s3';
import crypto from 'crypto'
import { Readable } from 'stream';
import { Provider } from '../../../uploads/provider'

interface AwsProviderOptions {
  credentials: {
    accessKeyId: string,
    secretAccesskey: string
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
        secretAccesskey: _options.credentials.secretAccesskey || process.env.RCTF_AWS_SECRET_ACCESS_KEY as string
      },
      bucketName: _options.bucketName || process.env.RCTF_AWS_BUCKET as string,
      region: _options.region || process.env.RCTF_AWS_REGION as string
    }
    // TODO: validate that all options are indeed provided

    this.client = new S3Client({
      region: options.region,
      credentials: {
        accessKeyId: options.credentials.accessKeyId,
        secretAccessKey: options.credentials.secretAccesskey
      }
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
      if (error instanceof NotFound) {
        return null
      } else {
        throw new Error('Unknown AWS error occurred')
      }
    }
  }

  upload = async (data: Buffer, name: string): Promise<string> => {
    const hash = crypto.createHash('sha256').update(data).digest('hex')
    const key = `uploads/${hash}/${name}`
    const file = await this.getAwsFile(hash, name)
    if (file === null) {
      // TODO: upload file to aws s3
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
