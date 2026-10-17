import mongoose, { Schema, Document, Model } from "mongoose";
import crypto from "node:crypto";

export interface MemberItem {
  name: string;
  rollNumber: string;
  branch: string;
  year: string;
  email: string;
}

export interface EditLog {
  timestamp: string;
  editedBy: string;
  changes: string;
}

export interface ScoreBreakdown {
  ppt: number;
  presentation: number;
  prototype: number;
  simulation: number;
  qa: number;
}

export interface RegistrationRecord {
  id: string;
  registrationId: string;
  teamName: string;
  leaderName: string;
  leaderRollNumber: string;
  leaderBranch: string;
  leaderYear: string;
  mobile: string;
  email: string;
  memberCount: number;
  members: MemberItem[];
  utr: string;
  paymentScreenshotUrl: string;
  paymentScreenshotPath: string;
  paymentStatus: "PENDING" | "VERIFIED" | "REJECTED";
  registrationStatus: "PENDING" | "CONFIRMED" | "REJECTED";
  score: number;
  scoreBreakdown?: ScoreBreakdown;
  finalScore?: number;
  finalScoreBreakdown?: ScoreBreakdown;
  isFinalist?: boolean;
  editLogs?: EditLog[];
  createdAt: string;
  updatedAt: string;
}

export interface IRegistrationDocument extends Document {
  registrationId: string;
  teamName: string;
  leaderName: string;
  leaderRollNumber?: string;
  leaderBranch: string;
  leaderYear: string;
  mobile: string;
  email: string;
  memberCount: number;
  members: MemberItem[];
  utr: string;
  paymentScreenshotUrl: string;
  paymentScreenshotPath: string;
  paymentStatus: "PENDING" | "VERIFIED" | "REJECTED";
  registrationStatus: "PENDING" | "CONFIRMED" | "REJECTED";
  score: number;
  scoreBreakdown?: ScoreBreakdown;
  finalScore?: number;
  finalScoreBreakdown?: ScoreBreakdown;
  isFinalist?: boolean;
  editLogs: { timestamp: Date; editedBy: string; changes: string }[];
  createdAt: Date;
  updatedAt: Date;
}

const MemberSchema = new Schema<MemberItem>(
  {
    name: { type: String, required: true },
    rollNumber: { type: String, default: "" },
    branch: { type: String, required: true },
    year: { type: String, required: true },
    email: { type: String, default: "" },
  },
  { _id: false }
);

const RegistrationSchema = new Schema<IRegistrationDocument>(
  {
    registrationId: { type: String, required: true, unique: true, index: true },
    teamName: { type: String, required: true },
    leaderName: { type: String, required: true },
    leaderRollNumber: { type: String, default: "" },
    leaderBranch: { type: String, required: true },
    leaderYear: { type: String, required: true },
    mobile: { type: String, required: true },
    email: { type: String, required: true, lowercase: true, index: true },
    memberCount: { type: Number, required: true },
    members: { type: [MemberSchema], default: [] },
    utr: { type: String, required: true, unique: true, uppercase: true, index: true },
    paymentScreenshotUrl: { type: String, required: true },
    paymentScreenshotPath: { type: String, required: true },
    paymentStatus: {
      type: String,
      enum: ["PENDING", "VERIFIED", "REJECTED"],
      default: "PENDING",
    },
    registrationStatus: {
      type: String,
      enum: ["PENDING", "CONFIRMED", "REJECTED"],
      default: "PENDING",
    },
    score: {
      type: Number,
      default: 0,
    },
    scoreBreakdown: {
      ppt: { type: Number, default: 0 },
      presentation: { type: Number, default: 0 },
      prototype: { type: Number, default: 0 },
      simulation: { type: Number, default: 0 },
      qa: { type: Number, default: 0 },
    },
    finalScore: {
      type: Number,
      default: 0,
    },
    finalScoreBreakdown: {
      ppt: { type: Number, default: 0 },
      presentation: { type: Number, default: 0 },
      prototype: { type: Number, default: 0 },
      simulation: { type: Number, default: 0 },
      qa: { type: Number, default: 0 },
    },
    isFinalist: {
      type: Boolean,
      default: false,
    },
    editLogs: {
      type: [
        {
          timestamp: { type: Date, default: Date.now },
          editedBy: { type: String },
          changes: { type: String },
        },
      ],
      default: [],
    },
  },
  {
    timestamps: true,
    strict: false,
  }
);

// Reuse model instance across Next.js API reloads
export interface ISystemSettingsDocument extends Document {
  key: string;
  value: any;
}

const SystemSettingsSchema = new Schema<ISystemSettingsDocument>({
  key: { type: String, required: true, unique: true },
  value: { type: Schema.Types.Mixed, required: true },
});

export interface JudgeItem {
  name: string;
}

export interface JudgePanelRecord {
  id: string;
  panelName: string;
  passkey: string;
  judges: JudgeItem[];
  createdAt: string;
  updatedAt: string;
}

export interface IJudgePanelDocument extends Document {
  panelName: string;
  passkey: string;
  judges: { name: string }[];
  createdAt: Date;
  updatedAt: Date;
}

const JudgePanelSchema = new Schema<IJudgePanelDocument>(
  {
    panelName: { type: String, required: true, trim: true },
    passkey: { type: String, required: true, unique: true, trim: true, index: true },
    judges: [
      {
        name: { type: String, required: true, trim: true },
      },
    ],
  },
  {
    timestamps: true,
  }
);

let Registration: Model<IRegistrationDocument>;
let SystemSettings: Model<ISystemSettingsDocument>;
let JudgePanel: Model<IJudgePanelDocument>;

if (mongoose.models.Registration) {
  delete (mongoose.models as any).Registration;
}
Registration = mongoose.model<IRegistrationDocument>("Registration", RegistrationSchema);

if (mongoose.models.SystemSettings) {
  SystemSettings = mongoose.model<ISystemSettingsDocument>("SystemSettings");
} else {
  SystemSettings = mongoose.model<ISystemSettingsDocument>("SystemSettings", SystemSettingsSchema);
}

if (mongoose.models.JudgePanel) {
  JudgePanel = mongoose.model<IJudgePanelDocument>("JudgePanel");
} else {
  JudgePanel = mongoose.model<IJudgePanelDocument>("JudgePanel", JudgePanelSchema);
}

export { Registration, SystemSettings, JudgePanel };

const RegistrationModel = Registration;

// Global cached connection for Next.js serverless/API routes
interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache = globalThis.mongooseCache || { conn: null, promise: null };
if (!globalThis.mongooseCache) {
  globalThis.mongooseCache = cached;
}

export async function connectToDatabase(): Promise<typeof mongoose> {
  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  const mongodbUri = process.env.MONGODB_URI || process.env.MONGODB_URL;

  if (!mongodbUri) {
    if (process.env.VERCEL || process.env.NODE_ENV === "production") {
      throw new Error(
        "MONGODB_URI is not configured in Vercel Environment Variables. Please set MONGODB_URI in your Vercel Project Settings."
      );
    }
  }

  const targetUri = mongodbUri || "mongodb://localhost:27017/embedx";

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(targetUri, {
        bufferCommands: false,
        dbName: "embedx",
        serverSelectionTimeoutMS: 6000, // 6 seconds fast timeout instead of hanging 30s
      })
      .then((m) => m);
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    cached.conn = null;
    console.error("MongoDB Atlas connection error:", e);
    throw new Error(
      "Database connection timed out. Please check that your MongoDB Atlas 'Network Access' has IP 0.0.0.0/0 (Allow access from anywhere) enabled."
    );
  }

  return cached.conn;
}

function docToRecord(doc: IRegistrationDocument | null): RegistrationRecord | null {
  if (!doc) return null;
  return {
    id: doc._id.toString(),
    registrationId: doc.registrationId,
    teamName: doc.teamName,
    leaderName: doc.leaderName,
    leaderRollNumber: doc.leaderRollNumber || "",
    leaderBranch: doc.leaderBranch,
    leaderYear: doc.leaderYear,
    mobile: doc.mobile,
    email: doc.email,
    memberCount: doc.memberCount,
    members: doc.members || [],
    utr: doc.utr,
    paymentScreenshotUrl: doc.paymentScreenshotUrl ?? "",
    paymentScreenshotPath: doc.paymentScreenshotPath ?? "",
    paymentStatus: doc.paymentStatus,
    registrationStatus: doc.registrationStatus,
    score: doc.score ?? 0,
    scoreBreakdown: doc.scoreBreakdown
      ? {
          ppt: doc.scoreBreakdown.ppt ?? 0,
          presentation: doc.scoreBreakdown.presentation ?? 0,
          prototype: doc.scoreBreakdown.prototype ?? 0,
          simulation: doc.scoreBreakdown.simulation ?? 0,
          qa: doc.scoreBreakdown.qa ?? 0,
        }
      : undefined,
    finalScore: doc.finalScore ?? 0,
    finalScoreBreakdown: doc.finalScoreBreakdown
      ? {
          ppt: doc.finalScoreBreakdown.ppt ?? 0,
          presentation: doc.finalScoreBreakdown.presentation ?? 0,
          prototype: doc.finalScoreBreakdown.prototype ?? 0,
          simulation: doc.finalScoreBreakdown.simulation ?? 0,
          qa: doc.finalScoreBreakdown.qa ?? 0,
        }
      : undefined,
    isFinalist: doc.isFinalist ?? false,
    editLogs: doc.editLogs ? doc.editLogs.map((log: any) => ({
      timestamp: log.timestamp ? new Date(log.timestamp).toISOString() : new Date().toISOString(),
      editedBy: log.editedBy,
      changes: log.changes,
    })) : [],
    createdAt: doc.createdAt ? doc.createdAt.toISOString() : new Date().toISOString(),
    updatedAt: doc.updatedAt ? doc.updatedAt.toISOString() : new Date().toISOString(),
  };
}

export function generateRegistrationId(): string {
  const randomSuffix = crypto.randomBytes(2).toString("hex").toUpperCase();
  const year = "2026";
  return `EMBX-${year}-${randomSuffix}`;
}

export async function createRegistration(
  data: Omit<RegistrationRecord, "id" | "createdAt" | "updatedAt">
): Promise<RegistrationRecord> {
  await connectToDatabase();

  const created = await RegistrationModel.create({
    registrationId: data.registrationId,
    teamName: data.teamName,
    leaderName: data.leaderName,
    leaderRollNumber: data.leaderRollNumber || "",
    leaderBranch: data.leaderBranch,
    leaderYear: data.leaderYear,
    mobile: data.mobile,
    email: data.email.toLowerCase().trim(),
    memberCount: data.memberCount,
    members: data.members || [],
    utr: data.utr.trim().toUpperCase(),
    paymentScreenshotUrl: data.paymentScreenshotUrl,
    paymentScreenshotPath: data.paymentScreenshotPath,
    paymentStatus: data.paymentStatus || "PENDING",
    registrationStatus: data.registrationStatus || "PENDING",
    score: data.score || 0,
  });

  return docToRecord(created)!;
}

export async function getRegistrationByRegistrationId(
  registrationId: string
): Promise<RegistrationRecord | null> {
  await connectToDatabase();
  const doc = await RegistrationModel.findOne({
    registrationId: registrationId.trim().toUpperCase(),
  }).exec();
  return docToRecord(doc);
}

export async function deleteRegistrationByRegistrationId(
  registrationId: string
): Promise<RegistrationRecord | null> {
  await connectToDatabase();
  const doc = await RegistrationModel.findOneAndDelete({
    registrationId: registrationId.trim().toUpperCase(),
  }).exec();
  return docToRecord(doc);
}

export async function getRegistrationByUtr(
  utr: string
): Promise<RegistrationRecord | null> {
  await connectToDatabase();
  const doc = await RegistrationModel.findOne({
    utr: utr.trim().toUpperCase(),
  }).exec();
  return docToRecord(doc);
}

export async function getRegistrationByEmail(
  email: string
): Promise<RegistrationRecord | null> {
  await connectToDatabase();
  const doc = await RegistrationModel.findOne({
    email: email.trim().toLowerCase(),
  }).exec();
  return docToRecord(doc);
}

export async function updateRegistrationStatus(
  registrationId: string,
  paymentStatus: "PENDING" | "VERIFIED" | "REJECTED",
  registrationStatus: "PENDING" | "CONFIRMED" | "REJECTED"
): Promise<RegistrationRecord | null> {
  await connectToDatabase();
  const updated = await RegistrationModel.findOneAndUpdate(
    { registrationId: registrationId.trim().toUpperCase() },
    { paymentStatus, registrationStatus },
    { new: true }
  ).exec();
  return docToRecord(updated);
}

export async function updateRegistrationDetails(
  registrationId: string,
  updates: Partial<RegistrationRecord>,
  logEntry?: { editedBy: string; changes: string }
): Promise<RegistrationRecord | null> {
  await connectToDatabase();
  const updateCmd: any = { $set: updates };
  if (logEntry) {
    updateCmd.$push = {
      editLogs: {
        timestamp: new Date(),
        editedBy: logEntry.editedBy,
        changes: logEntry.changes,
      },
    };
  }
  const updated = await RegistrationModel.findOneAndUpdate(
    { registrationId: registrationId.trim().toUpperCase() },
    updateCmd,
    { new: true }
  ).exec();
  return docToRecord(updated);
}

export async function getAllRegistrations(options?: {
  status?: string;
  query?: string;
}): Promise<RegistrationRecord[]> {
  await connectToDatabase();

  const filter: Record<string, unknown> = {};

  if (options?.status && options.status !== "ALL") {
    filter.$or = [
      { registrationStatus: options.status },
      { paymentStatus: options.status },
    ];
  }

  if (options?.query && options.query.trim() !== "") {
    const q = options.query.trim();
    const regex = new RegExp(q, "i");
    filter.$or = [
      { teamName: regex },
      { leaderName: regex },
      { email: regex },
      { registrationId: regex },
      { utr: regex },
    ];
  }

  // Exclude the (potentially multi-MB base64) screenshot fields from list views —
  // callers that need one team's screenshot should fetch it individually via
  // getRegistrationByRegistrationId(). Without this, listing N registrations
  // pulls N screenshots at once, which has been observed to take minutes.
  const docs = await RegistrationModel.find(filter)
    .select("-paymentScreenshotUrl -paymentScreenshotPath")
    .sort({ createdAt: -1 })
    .exec();

  return docs.map((doc) => docToRecord(doc)!);
}

export async function getRegistrationStats(): Promise<{
  total: number;
  pending: number;
  confirmed: number;
  rejected: number;
}> {
  await connectToDatabase();

  const [total, pending, confirmed, rejected] = await Promise.all([
    RegistrationModel.countDocuments(),
    RegistrationModel.countDocuments({ registrationStatus: "PENDING" }),
    RegistrationModel.countDocuments({ registrationStatus: "CONFIRMED" }),
    RegistrationModel.countDocuments({ registrationStatus: "REJECTED" }),
  ]);

  return { total, pending, confirmed, rejected };
}

function judgePanelDocToRecord(doc: IJudgePanelDocument | null): JudgePanelRecord | null {
  if (!doc) return null;
  return {
    id: doc._id.toString(),
    panelName: doc.panelName,
    passkey: doc.passkey,
    judges: (doc.judges || []).map((j: any) => ({ name: typeof j === "string" ? j : j.name })),
    createdAt: doc.createdAt ? doc.createdAt.toISOString() : new Date().toISOString(),
    updatedAt: doc.updatedAt ? doc.updatedAt.toISOString() : new Date().toISOString(),
  };
}

export async function getAllJudgePanels(): Promise<JudgePanelRecord[]> {
  await connectToDatabase();
  const docs = await JudgePanel.find().sort({ createdAt: -1 }).exec();
  return docs.map((doc) => judgePanelDocToRecord(doc)!);
}

export async function getJudgePanelByPasskey(passkey: string): Promise<JudgePanelRecord | null> {
  await connectToDatabase();
  const doc = await JudgePanel.findOne({ passkey: passkey.trim() }).exec();
  return judgePanelDocToRecord(doc);
}

export async function createJudgePanel(data: {
  panelName: string;
  passkey: string;
  judges: { name: string }[];
}): Promise<JudgePanelRecord> {
  await connectToDatabase();
  const created = await JudgePanel.create({
    panelName: data.panelName.trim(),
    passkey: data.passkey.trim(),
    judges: data.judges,
  });
  return judgePanelDocToRecord(created)!;
}

export async function updateJudgePanel(
  id: string,
  data: Partial<{ panelName: string; passkey: string; judges: { name: string }[] }>
): Promise<JudgePanelRecord | null> {
  await connectToDatabase();
  const updateData: any = {};
  if (data.panelName !== undefined) updateData.panelName = data.panelName.trim();
  if (data.passkey !== undefined) updateData.passkey = data.passkey.trim();
  if (data.judges !== undefined) updateData.judges = data.judges;

  const updated = await JudgePanel.findByIdAndUpdate(id, updateData, { new: true }).exec();
  return judgePanelDocToRecord(updated);
}

export async function deleteJudgePanel(id: string): Promise<boolean> {
  await connectToDatabase();
  const res = await JudgePanel.findByIdAndDelete(id).exec();
  return !!res;
}
