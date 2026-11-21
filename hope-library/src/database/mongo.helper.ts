import { randomUUID } from 'node:crypto';
import type { ClientSession, Connection, Model } from 'mongoose';

/**
 * Escape các ký tự đặc biệt của RegExp để tìm kiếm an toàn với $regex trong MongoDB
 */
export function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Tạo biểu thức RegExp không phân biệt hoa thường cho tìm kiếm substring (tương đương LIKE %keyword%)
 */
export function buildContainsRegex(keyword: string): RegExp {
  return new RegExp(escapeRegex(keyword.trim()), 'i');
}

/**
 * Tạo biểu thức RegExp không phân biệt hoa thường cho khớp chính xác (tương đương UPPER(col) = UPPER(val))
 */
export function buildExactIgnoreCaseRegex(value: string): RegExp {
  return new RegExp(`^${escapeRegex(value.trim())}$`, 'i');
}

/**
 * Loại bỏ _id và __v của Mongoose rồi khởi tạo instance thực thể chuẩn cho AutoMapper
 */
export function toEntity<T>(
  EntityClass: new (partial?: Partial<T>) => T,
  doc: unknown,
): T | null {
  if (!doc) {
    return null;
  }
  const raw =
    typeof (doc as { toObject?: () => Record<string, unknown> }).toObject === 'function'
      ? (doc as { toObject: () => Record<string, unknown> }).toObject()
      : { ...(doc as Record<string, unknown>) };

  delete raw._id;
  delete raw.__v;

  return new EntityClass(raw as Partial<T>);
}

/**
 * Chuyển đổi mảng document Mongoose sang mảng instance thực thể
 */
export function toEntities<T>(
  EntityClass: new (partial?: Partial<T>) => T,
  docs: unknown[] | null | undefined,
): T[] {
  if (!Array.isArray(docs) || docs.length === 0) {
    return [];
  }
  return docs
    .map((doc) => toEntity(EntityClass, doc))
    .filter((item): item is T => item !== null);
}

/**
 * Chuẩn hóa dữ liệu plain object trước khi ghi vào MongoDB (bỏ _id, __v, đảm bảo có id UUID nếu cần)
 */
export function prepareDocumentForSave<T extends Record<string, any>>(
  entity: T,
  hasUuidId: boolean = true,
): Record<string, any> {
  const plain: Record<string, any> = { ...entity };
  delete plain._id;
  delete plain.__v;
  if (hasUuidId && !plain.id) {
    plain.id = randomUUID();
    (entity as Record<string, any>).id = plain.id;
  }
  if (!plain.createdAt) {
    plain.createdAt = new Date();
  }
  plain.updatedAt = new Date();
  return plain;
}

/**
 * Transaction Manager nhẹ chạy trên MongoDB ClientSession,
 * tương thích với các thao tác CRUD/increment/decrement trong LoanService.
 */
export class MongoTransactionManager {
  constructor(
    private readonly connection: Connection,
    public readonly session: ClientSession,
  ) {}

  getModel<T>(EntityClass: new (partial?: Partial<T>) => T): Model<any> {
    return this.connection.model(EntityClass.name) as unknown as Model<any>;
  }

  create<T>(
    EntityClass: new (partial?: Partial<T>) => T,
    data: Partial<T>,
  ): T {
    return new EntityClass(data);
  }

  async save<T extends Record<string, any>>(
    EntityClass: new (partial?: Partial<T>) => T,
    entityOrEntities: T,
  ): Promise<T>;
  async save<T extends Record<string, any>>(
    EntityClass: new (partial?: Partial<T>) => T,
    entityOrEntities: T[],
  ): Promise<T[]>;
  async save<T extends Record<string, any>>(
    EntityClass: new (partial?: Partial<T>) => T,
    entityOrEntities: T | T[],
  ): Promise<T | T[]> {
    const model = this.getModel(EntityClass);
    const saveOne = async (item: T): Promise<T> => {
      const hasIdField = Boolean(model.schema.path('id'));
      const payload = prepareDocumentForSave(item, hasIdField);
      if (hasIdField) {
        const saved = await model
          .findOneAndUpdate(
            { id: payload.id },
            { $set: payload },
            { upsert: true, returnDocument: 'after', session: this.session },
          )
          .lean()
          .exec();
        return toEntity(EntityClass, saved) ?? item;
      }

      const [created] = await model.create([payload], { session: this.session });
      return toEntity(EntityClass, created) ?? item;
    };

    if (Array.isArray(entityOrEntities)) {
      const results: T[] = [];
      for (const item of entityOrEntities) {
        results.push(await saveOne(item));
      }
      return results;
    }

    return saveOne(entityOrEntities);
  }

  async find<T>(
    EntityClass: new (partial?: Partial<T>) => T,
    options?: {
      where?: Record<string, any>;
      relations?: Record<string, any>;
    },
  ): Promise<T[]> {
    const model = this.getModel(EntityClass);
    const filter = options?.where ?? {};
    const docs = await model.find(filter).session(this.session).lean().exec();
    const entities = toEntities(EntityClass, docs);

    // Hỗ trợ nạp quan hệ `book` cho BookCopy khi được yêu cầu trong transaction
    if (options?.relations?.book && EntityClass.name === 'BookCopy' && entities.length > 0) {
      const bookIds = [
        ...new Set(
          entities
            .map((e: any) => e.bookId)
            .filter((id: unknown): id is string => typeof id === 'string' && id.length > 0),
        ),
      ];
      if (bookIds.length > 0) {
        const bookModel = this.connection.model('Book');
        const bookDocs = await bookModel
          .find({ id: { $in: bookIds } })
          .session(this.session)
          .lean()
          .exec();
        const bookMap = new Map(bookDocs.map((b: any) => [b.id, b]));
        for (const entity of entities as any[]) {
          const b = bookMap.get(entity.bookId);
          if (b) {
            const cleaned = { ...b };
            delete cleaned._id;
            delete cleaned.__v;
            entity.book = cleaned;
          }
        }
      }
    }

    return entities;
  }

  async findOne<T>(
    EntityClass: new (partial?: Partial<T>) => T,
    options?: {
      where?: Record<string, any>;
    },
  ): Promise<T | null> {
    const model = this.getModel(EntityClass);
    const filter = options?.where ?? {};
    const doc = await model.findOne(filter).session(this.session).lean().exec();
    return toEntity(EntityClass, doc);
  }

  async delete<T>(
    EntityClass: new (partial?: Partial<T>) => T,
    criteria: Record<string, any> | string,
  ): Promise<{ affected: number }> {
    const model = this.getModel(EntityClass);
    const filter = typeof criteria === 'string' ? { id: criteria } : criteria;
    const res = await model.deleteMany(filter).session(this.session).exec();
    return { affected: res.deletedCount ?? 0 };
  }

  async increment<T>(
    EntityClass: new (partial?: Partial<T>) => T,
    criteria: Record<string, any>,
    propertyPath: string,
    value: number,
  ): Promise<void> {
    const model = this.getModel(EntityClass);
    await model
      .updateMany(criteria, { $inc: { [propertyPath]: value } })
      .session(this.session)
      .exec();
  }

  async decrement<T>(
    EntityClass: new (partial?: Partial<T>) => T,
    criteria: Record<string, any>,
    propertyPath: string,
    value: number,
  ): Promise<void> {
    const model = this.getModel(EntityClass);
    await model
      .updateMany(criteria, { $inc: { [propertyPath]: -value } })
      .session(this.session)
      .exec();
  }
}
