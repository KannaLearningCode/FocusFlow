import mongoose, { Schema, Model } from "mongoose";

export interface IUserSettings {
    userId: string;
    aiLevel: string; // A1, A2, B1, B2, C1, C2
}

const UserSettingsSchema = new Schema<IUserSettings>({
    userId: { type: String, required: true, unique: true, default: 'default' },
    aiLevel: { type: String, default: 'B2', enum: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] },
});

const UserSettings: Model<IUserSettings> = mongoose.models.UserSettings || mongoose.model("UserSettings", UserSettingsSchema);

export default UserSettings;
