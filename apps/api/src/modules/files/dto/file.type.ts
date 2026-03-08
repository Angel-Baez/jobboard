import { ObjectType, Field, ID, Int } from '@nestjs/graphql';

@ObjectType()
export class FileType {
  @Field(() => ID)
  id: number;

  @Field()
  type: string;

  @Field()
  url: string;

  @Field()
  originalName: string;

  @Field()
  mimeType: string;

  @Field(() => Int)
  sizeBytes: number;

  @Field()
  createdAt: Date;
}

/** Returned by presign endpoint — not stored in DB yet */
@ObjectType()
export class PresignedUploadType {
  @Field()
  uploadUrl: string;

  @Field()
  storageKey: string;

  @Field()
  publicUrl: string;
}
