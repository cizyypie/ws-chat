export interface MessageMessage {
  type: "message" | "join" | "leave";
  username?: string;
  content?: string;
  timestamp?: Date;
}
