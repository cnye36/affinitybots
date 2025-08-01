import React from 'react';
import { FileText, Image, Video, AudioLines, Archive, File, Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AttachmentCardProps {
  fileName: string;
  fileSize: number;
  attachmentType: 'image' | 'document' | 'video' | 'audio' | 'archive' | 'other';
  processingStatus?: 'pending' | 'processing' | 'completed' | 'failed';
  thumbnailUrl?: string;
  className?: string;
}

const AttachmentCard: React.FC<AttachmentCardProps> = ({
  fileName,
  fileSize,
  attachmentType,
  processingStatus = 'completed',
  thumbnailUrl,
  className,
}) => {
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getIcon = () => {
    const iconProps = { className: "w-5 h-5" };
    
    switch (attachmentType) {
      case 'image':
        return <Image {...iconProps} />;
      case 'document':
        return <FileText {...iconProps} />;
      case 'video':
        return <Video {...iconProps} />;
      case 'audio':
        return <AudioLines {...iconProps} />;
      case 'archive':
        return <Archive {...iconProps} />;
      default:
        return <File {...iconProps} />;
    }
  };

  const getStatusIcon = () => {
    switch (processingStatus) {
      case 'pending':
      case 'processing':
        return <Loader2 className="w-4 h-4 animate-spin text-blue-500" />;
      case 'completed':
        return <Check className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <div className="w-4 h-4 rounded-full bg-red-500" />;
      default:
        return null;
    }
  };

  const getStatusText = () => {
    switch (processingStatus) {
      case 'pending':
        return 'Processing...';
      case 'processing':
        return 'Processing...';
      case 'completed':
        return 'Ready';
      case 'failed':
        return 'Failed';
      default:
        return '';
    }
  };

  const getBorderColor = () => {
    switch (attachmentType) {
      case 'image':
        return 'border-purple-200 dark:border-purple-600';
      case 'document':
        return 'border-blue-200 dark:border-blue-600';
      case 'video':
        return 'border-red-200 dark:border-red-600';
      case 'audio':
        return 'border-green-200 dark:border-green-600';
      case 'archive':
        return 'border-yellow-200 dark:border-yellow-600';
      default:
        return 'border-gray-200 dark:border-gray-600';
    }
  };

  const getBackgroundColor = () => {
    switch (attachmentType) {
      case 'image':
        return 'bg-purple-50 dark:bg-purple-900/20';
      case 'document':
        return 'bg-blue-50 dark:bg-blue-900/20';
      case 'video':
        return 'bg-red-50 dark:bg-red-900/20';
      case 'audio':
        return 'bg-green-50 dark:bg-green-900/20';
      case 'archive':
        return 'bg-yellow-50 dark:bg-yellow-900/20';
      default:
        return 'bg-gray-50 dark:bg-gray-800';
    }
  };

  return (
    <div
      className={cn(
        "inline-flex items-center gap-3 p-3 rounded-lg border max-w-sm",
        getBorderColor(),
        getBackgroundColor(),
        className
      )}
    >
      {/* Thumbnail or Icon */}
      <div className="flex-shrink-0">
        {thumbnailUrl && attachmentType === 'image' ? (
          <div className="w-10 h-10 rounded overflow-hidden">
            <img
              src={thumbnailUrl}
              alt={fileName}
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className={cn(
            "w-10 h-10 rounded flex items-center justify-center",
            attachmentType === 'image' ? 'bg-purple-100 dark:bg-purple-800 text-purple-600 dark:text-purple-300' :
            attachmentType === 'document' ? 'bg-blue-100 dark:bg-blue-800 text-blue-600 dark:text-blue-300' :
            attachmentType === 'video' ? 'bg-red-100 dark:bg-red-800 text-red-600 dark:text-red-300' :
            attachmentType === 'audio' ? 'bg-green-100 dark:bg-green-800 text-green-600 dark:text-green-300' :
            attachmentType === 'archive' ? 'bg-yellow-100 dark:bg-yellow-800 text-yellow-600 dark:text-yellow-300' :
            'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
          )}>
            {getIcon()}
          </div>
        )}
      </div>

      {/* File Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
            {fileName}
          </p>
          {getStatusIcon()}
        </div>
        <div className="flex items-center gap-2 mt-1">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {formatFileSize(fileSize)}
          </p>
          {processingStatus !== 'completed' && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              • {getStatusText()}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AttachmentCard;