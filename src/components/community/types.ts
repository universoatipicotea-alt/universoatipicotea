export type CommunityAttachment = {
  id: number;
  url: string;
  altText?: string | null;
  mimeType?: string | null;
  width?: number | null;
  height?: number | null;
  position?: number | null;
};

export type CommunityAuthor = {
  authorId: number;
  authorName?: string | null;
  authorDisplayName?: string | null;
  authorAvatarUrl?: string | null;
  viewerIsAuthor?: boolean;
};

export type CommunityTopic = CommunityAuthor & {
  id: number;
  title: string;
  body: string;
  category: string;
  status?: string;
  isPinned?: boolean;
  createdAt: string;
  updatedAt?: string | null;
  lastActivityAt?: string | null;
  commentCount?: number;
  reactionCount?: number;
  likeCount?: number;
  viewerReacted?: boolean;
  viewerIsAuthor?: boolean;
  likedByCurrentUser?: boolean;
  attachments?: CommunityAttachment[];
  editedAt?: string | null;
};

export type CommunityComment = CommunityAuthor & {
  id: number;
  topicId?: number;
  parentCommentId?: number | null;
  parentAuthorName?: string | null;
  body: string;
  status?: string;
  createdAt: string;
  editedAt?: string | null;
  reactionCount?: number;
  likeCount?: number;
  viewerReactions?: string[];
  viewerReacted?: boolean;
  viewerIsAuthor?: boolean;
  isDeleted?: boolean;
};

export type CommunityFeedPage = {
  items: CommunityTopic[];
  nextCursor: string | null;
};

export type CommunityCommentPage = {
  items: CommunityComment[];
  nextCursor: string | null;
};

export type CommunityTopicDetail = {
  topic: CommunityTopic;
  comments: CommunityComment[];
  nextCommentCursor?: string | null;
};

export type PendingCommunityImage = {
  localId: string;
  file: File;
  previewUrl: string;
};
