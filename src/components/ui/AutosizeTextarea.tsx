'use client';
import * as React from 'react';
import { cn } from '@/lib/utils';
import { useImperativeHandle } from 'react';

interface UseAutosizeTextAreaProps {
    textAreaRef: React.MutableRefObject<HTMLTextAreaElement | null>;
    minHeight?: number;
    maxHeight?: number;
    triggerAutoSize: string;
}

export const useAutosizeTextArea = ({
    textAreaRef,
    triggerAutoSize,
    maxHeight = Number.MAX_SAFE_INTEGER,
    minHeight = 0,
}: UseAutosizeTextAreaProps) => {
    React.useLayoutEffect(() => {
        // We need to reset the height momentarily to get the correct scrollHeight for the textarea
        const offsetBorder = 0;
        const textAreaElement = textAreaRef.current;
        if (textAreaElement) {
            textAreaElement.style.minHeight = `${minHeight + offsetBorder}px`;
            textAreaElement.style.maxHeight = maxHeight > minHeight ? `${maxHeight}px` : '';
            textAreaElement.style.height = `${minHeight + offsetBorder}px`;
            const scrollHeight = textAreaElement.scrollHeight;
            // We then set the height directly, outside of the render loop
            // Trying to set this with state or a ref will product an incorrect value.
            if (scrollHeight > maxHeight) {
                textAreaElement.style.height = `${maxHeight}px`;
            } else {
                textAreaElement.style.height = `${scrollHeight + offsetBorder}px`;
            }
        }
    }, [textAreaRef, triggerAutoSize, minHeight, maxHeight]);
};

export type AutosizeTextAreaRef = {
    textArea: HTMLTextAreaElement;
    maxHeight: number;
    minHeight: number;
};

type AutosizeTextAreaProps = {
    maxHeight?: number;
    minHeight?: number;
} & React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export const AutosizeTextarea = React.forwardRef<AutosizeTextAreaRef, AutosizeTextAreaProps>(
    (
        {
            maxHeight = Number.MAX_SAFE_INTEGER,
            minHeight = 52,
            className,
            onChange,
            value,
            ...props
        }: AutosizeTextAreaProps,
        ref: React.Ref<AutosizeTextAreaRef>,
    ) => {
        const textAreaRef = React.useRef<HTMLTextAreaElement | null>(null);
        const [uncontrolledValue, setUncontrolledValue] = React.useState(
            () => String(props.defaultValue ?? ''),
        );

        useAutosizeTextArea({
            textAreaRef,
            triggerAutoSize: String(value ?? uncontrolledValue),
            maxHeight,
            minHeight,
        });

        useImperativeHandle(ref, () => ({
            textArea: textAreaRef.current as HTMLTextAreaElement,
            focus: () => textAreaRef?.current?.focus(),
            maxHeight,
            minHeight,
        }));

        return (
            <textarea
                {...props}
                value={value}
                ref={textAreaRef}
                className={cn(
                    'flex w-full  border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground  focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 ',
                    className,
                )}
                onChange={(e) => {
                    if (value === undefined) setUncontrolledValue(e.target.value);
                    onChange?.(e);
                }}
            />
        );
    },
);
AutosizeTextarea.displayName = 'AutosizeTextarea';
