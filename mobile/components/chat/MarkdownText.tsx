import React, { useMemo } from 'react';
import Markdown from 'react-native-markdown-display';
import { TextProps } from 'react-native';

interface MarkdownThemeColors {
  markdownHeading?: string;
  markdownStrong?: string;
  markdownCodeBackground?: string;
  markdownCodeInlineBackground?: string;
  markdownBlockquoteBackground?: string;
  markdownLink?: string;
  markdownHr?: string;
}

interface MarkdownTextProps extends Omit<TextProps, 'style'> {
  children: string;
  color?: string;
  fontSize?: number;
  lineHeight?: number;
  letterSpacing?: number;
  fontFamily?: string;
  themeColors?: MarkdownThemeColors;
}

/**
 * MarkdownText
 * ChatGPT-style, Expo-safe, final polished version
 */
export const MarkdownText = React.memo(
  ({
    children,
    color = '#0F172A',
    fontSize = 15,
    lineHeight,
    letterSpacing = 0,
    fontFamily = 'System',
    themeColors,
  }: MarkdownTextProps) => {
    const resolvedLineHeight = lineHeight ?? fontSize * 1.6;

    // Resolve theme colors with fallbacks
    const headingColor = themeColors?.markdownHeading || color;
    const strongColor = themeColors?.markdownStrong || color;
    const codeBlockBg = themeColors?.markdownCodeBackground || '#F8F4EE';
    const codeInlineBg = themeColors?.markdownCodeInlineBackground || 'rgba(15,23,42,0.08)';
    const blockquoteBg = themeColors?.markdownBlockquoteBackground || '#F8F4EE';
    const linkColor = themeColors?.markdownLink || '#2563EB';
    const hrColor = themeColors?.markdownHr || 'rgba(15,23,42,0.12)';

    /**
     * Normalize markdown for:
     * - iOS list safety
     * - consistent spacing
     */
    const normalizedMarkdown = useMemo(() => {
      if (!children) return '';

      let text = children.trim();

      // Add breathing room
      text = `\n${text}`;

      // Normalize excessive newlines
      text = text.replace(/\n{3,}/g, '\n\n');

      // Space before headings
      text = text.replace(
        /([^\n])\n(#{1,6}\s)/g,
        '$1\n\n$2'
      );

      // Ordered list → bold number (iOS safe)
      text = text.replace(
        /^(\s*)(\d+)\.\s+(.*)$/gm,
        '\n$1**$2.** $3'
      );

      // Bullets → bullet char (not markdown list)
      text = text.replace(
        /^(\s*)[-*]\s+(.*)$/gm,
        '$1• $2'
      );

      return text.trim();
    }, [children]);

    const codeBlockStyle = {
      backgroundColor: codeBlockBg,
      borderRadius: 12,
      padding: 14,
      marginVertical: 10,
    };

    const blockquoteStyle = {
      backgroundColor: blockquoteBg,
      borderRadius: 12,
      padding: 14,
      marginVertical: 10,
    };

    const markdownStyles = {
      /* Base text */
      body: {
        color,
        fontSize,
        fontFamily,
        lineHeight: resolvedLineHeight,
        letterSpacing,
      },

      paragraph: {
        marginTop: 0,
        marginBottom: 16,
      },

      text: {
        marginBottom: 12,
        lineHeight: resolvedLineHeight * 1.2,
      },

      /* Headings */
      heading1: {
        fontSize: fontSize * 1.35,
        fontWeight: '700' as const,
        fontFamily: 'SFProDisplayBold',
        color: headingColor,
        marginTop: 14,
        marginBottom: 8,
      },
      heading2: {
        fontSize: fontSize * 1.25,
        fontWeight: '700' as const,
        fontFamily: 'SFProDisplayBold',
        color: headingColor,
        marginTop: 14,
        marginBottom: 6,
      },
      heading3: {
        fontSize: fontSize * 1.15,
        fontWeight: '700' as const,
        fontFamily: 'SFProDisplayBold',
        color: headingColor,
        marginTop: 12,
        marginBottom: 6,
      },

      /* 🔑 Labels like Action, Specifics */
      strong: {
        fontWeight: '700' as const,
        fontFamily: 'SFProDisplayBold',
        color: strongColor,
      },

      em: {
        fontStyle: 'italic' as const,
      },

      /* Inner code box */
      code_block: {
        ...codeBlockStyle,
        fontFamily,
        fontSize,
        color,
      },
      fence: {
        ...codeBlockStyle,
        fontFamily,
        fontSize,
        color,
      },

      /* Inline code */
      code_inline: {
        backgroundColor: codeInlineBg,
        fontFamily,
        fontSize: fontSize - 1,
        paddingHorizontal: 4,
        paddingVertical: 2,
        borderRadius: 4,
        color,
      },

      /* Blockquote */
      blockquote: {
        ...blockquoteStyle,
      },

      /* Links */
      link: {
        color: linkColor,
        textDecorationLine: 'underline' as const,
      },

      hr: {
        backgroundColor: hrColor,
        height: 1,
        marginVertical: 18,
      },
    };

    return (
      <Markdown style={markdownStyles}>
        {normalizedMarkdown}
      </Markdown>
    );
  }
);

MarkdownText.displayName = 'MarkdownText';
