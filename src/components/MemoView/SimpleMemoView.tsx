'use client';
import React, { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { convertGMTDateToLocal } from '@/utils/parser';
import { Note } from '../../api/type';

const SimpleMemoView: React.FC<Note> = ({
  content,
  link,
  createdAt,
  syncState,
}) => {
  const localTime = useMemo(() => {
    return createdAt ? convertGMTDateToLocal(new Date(createdAt)) : null;
  }, [createdAt]);
  return (
    <Card className="px-2 py-1 rounded overflow-hidden w-full">
      <div className="font-medium">
        <p className="whitespace-pre-wrap break-words w-full leading-5 text-sm">
          {content}
          <span className="text-xs text-gray-500 ml-2">{localTime}</span>
          {syncState === 'pending' && (
            <span className="ml-2 text-xs text-amber-600 dark:text-amber-400">
              待同步
            </span>
          )}
        </p>
      </div>
      {link?.link && (
        <div className="mt-1">
          <a
            href={link.link}
            target="_blank"
            rel="noreferrer"
            className="text-blue-500 hover:underline text-sm"
          >
            {link.text || link.link}
          </a>
        </div>
      )}
    </Card>
  );
};

export default SimpleMemoView;
