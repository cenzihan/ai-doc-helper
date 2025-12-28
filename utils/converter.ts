
import { 
  Document, Packer, Paragraph, TextRun, HeadingLevel, 
  AlignmentType, Table, TableRow, TableCell, WidthType, 
  BorderStyle, ShadingType, VerticalAlign,
  Math as DocxMath, MathRun, ImageRun
} from 'docx';
import { WordTemplate, DocumentStyle } from '../types';

/**
 * 简单的 HTML 转 Markdown 工具 (浏览器端实现，无需 Pandoc)
 */
export function htmlToMarkdown(html: string): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  let md = '';

  // 递归处理节点
  function processNode(node: Node) {
    if (node.nodeType === Node.TEXT_NODE) {
      md += node.textContent;
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement;
      switch (el.tagName.toLowerCase()) {
        case 'h1': md += '\n# '; break;
        case 'h2': md += '\n## '; break;
        case 'h3': md += '\n### '; break;
        case 'p': md += '\n\n'; break;
        case 'strong': 
        case 'b': md += '**'; break;
        case 'em': 
        case 'i': md += '*'; break;
        case 'li': md += '\n- '; break;
        case 'br': md += '\n'; break;
        case 'code': md += '`'; break;
        case 'pre': md += '\n```\n'; break;
      }

      el.childNodes.forEach(child => processNode(child));

      switch (el.tagName.toLowerCase()) {
        case 'h1': case 'h2': case 'h3': md += '\n'; break;
        case 'p': md += '\n'; break;
        case 'strong': case 'b': md += '**'; break;
        case 'em': case 'i': md += '*'; break;
        case 'code': md += '`'; break;
        case 'pre': md += '\n```\n'; break;
      }
    }
  }

  processNode(doc.body);
  // 简单的清理
  return md.replace(/\n\n\n+/g, '\n\n').trim();
}

/**
 * 将文本解析为带有样式的 TextRun 数组
 */
function parseInlineStyles(text: string, font: string, fontSize: number, color: string): (TextRun | DocxMath)[] {
  const runs: (TextRun | DocxMath)[] = [];
  // 匹配：加粗 (**), 斜体 (*), 行内代码 (`), 公式 ($)
  // 注意：需要避免匹配到图片标记 ![...](...)
  // 简单的处理：先不处理图片内的文本。
  
  const regex = /(\*\*\*?|__?|`|\$)(.*?)\1/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    // 添加匹配前的纯文本
    if (match.index > lastIndex) {
      runs.push(new TextRun({ text: text.substring(lastIndex, match.index), font, size: fontSize * 2, color }));
    }

    const marker = match[1];
    const content = match[2];

    if (marker === '***') {
      runs.push(new TextRun({ text: content, font, size: fontSize * 2, bold: true, italics: true, color }));
    } else if (marker === '**' || marker === '__') {
      runs.push(new TextRun({ text: content, font, size: fontSize * 2, bold: true, color }));
    } else if (marker === '*' || marker === '_') {
      runs.push(new TextRun({ text: content, font, size: fontSize * 2, italics: true, color }));
    } else if (marker === '`') {
      runs.push(new TextRun({ 
        text: content, 
        font: "JetBrains Mono", 
        size: (fontSize - 1) * 2, 
        shading: { type: ShadingType.SOLID, color: "F1F5F9" },
        color: "E11D48" 
      }));
    } else if (marker === '$') {
      // 使用 DocxMath 和 MathRun 包裹行内公式 (Docx 原生支持)
      runs.push(new DocxMath({
        children: [new MathRun(content)]
      }));
    }

    lastIndex = regex.lastIndex;
  }

  // 添加剩余文本
  if (lastIndex < text.length) {
    runs.push(new TextRun({ text: text.substring(lastIndex), font, size: fontSize * 2, color }));
  }

  return runs;
}

const DEFAULT_STYLES: Record<string, DocumentStyle> = {
  [WordTemplate.STANDARD]: {
    fontFace: "SimSun",
    fontSize: 12,
    lineSpacing: 1.2,
    headingColor: "000000",
    textColor: "000000",
    alignment: "justify",
    paragraphSpacing: 200
  },
  [WordTemplate.ACADEMIC]: {
    fontFace: "Times New Roman",
    fontSize: 10.5,
    lineSpacing: 1.5,
    headingColor: "000000",
    textColor: "000000",
    alignment: "justify",
    paragraphSpacing: 100
  },
  [WordTemplate.NOTE]: {
    fontFace: "Microsoft YaHei",
    fontSize: 11,
    lineSpacing: 1.5,
    headingColor: "2563EB",
    textColor: "374151",
    alignment: "left",
    paragraphSpacing: 300
  }
};

/**
 * Helper to fetch image data as ArrayBuffer and detect its natural dimensions
 */
async function fetchImageBuffer(url: string): Promise<{ data: ArrayBuffer, width: number, height: number } | null> {
    try {
        const response = await fetch(url);
        if (!response.ok) return null;
        const blob = await response.blob();
        const buffer = await blob.arrayBuffer();
        
        // Detect dimensions using HTML Image object
        const dimensions = await new Promise<{ width: number, height: number }>((resolve) => {
            const img = new Image();
            img.onload = () => {
                const dims = { width: img.naturalWidth, height: img.naturalHeight };
                URL.revokeObjectURL(img.src);
                resolve(dims);
            };
            img.onerror = () => {
                 URL.revokeObjectURL(img.src);
                 resolve({ width: 600, height: 400 }); // Fallback defaults
            };
            img.src = URL.createObjectURL(blob);
        });
        
        return { data: buffer, width: dimensions.width, height: dimensions.height }; 
    } catch (e) {
        console.warn("Failed to fetch image for docx:", url);
        return null;
    }
}

export async function downloadDocx(markdown: string, template: WordTemplate, customStyle?: DocumentStyle) {
  const lines = markdown.split('\n');
  const sections: any[] = [];
  
  // 决定使用哪种样式配置
  const style = (template === WordTemplate.CUSTOM && customStyle) ? customStyle : (DEFAULT_STYLES[template] || DEFAULT_STYLES[WordTemplate.STANDARD]);
  
  const font = style.fontFace;
  const fontSize = style.fontSize; 
  const headingColor = style.headingColor;
  
  // mapping alignment string to enum
  // Fix TS2322: use 'any' to avoid strict enum type checking issues in build
  let align: any = AlignmentType.LEFT;
  if (style.alignment === 'center') align = AlignmentType.CENTER;
  if (style.alignment === 'justify') align = AlignmentType.JUSTIFIED;
  if (style.alignment === 'right') align = AlignmentType.RIGHT;

  let i = 0;
  while (i < lines.length) {
    let line = lines[i].trim();

    // 1. 处理标题
    if (line.startsWith('#')) {
      const level = line.match(/^#+/)?.[0].length || 1;
      const content = line.replace(/^#+\s*/, '');
      sections.push(new Paragraph({
        children: parseInlineStyles(content, font, fontSize + (4-level)*2, headingColor) as any,
        heading: level === 1 ? HeadingLevel.HEADING_1 : (level === 2 ? HeadingLevel.HEADING_2 : HeadingLevel.HEADING_3),
        spacing: { before: 400, after: 200 },
        alignment: level === 1 ? AlignmentType.CENTER : AlignmentType.LEFT,
      }));
      i++;
    } 
    // 2. 处理图片 ![alt](url)
    else if (line.match(/^!\[(.*?)\]\((.*?)\)/)) {
        const match = line.match(/^!\[(.*?)\]\((.*?)\)/);
        if (match) {
            const alt = match[1];
            const url = match[2];
            
            // Try to fetch image
            const imgData = await fetchImageBuffer(url);
            
            if (imgData) {
                // Smart Scaling: Preserve aspect ratio, but fit within page margins
                // A4 content width is roughly 600px (depends on margins)
                const MAX_WIDTH = 600; 
                let finalWidth = imgData.width;
                let finalHeight = imgData.height;

                if (finalWidth > MAX_WIDTH) {
                    const ratio = MAX_WIDTH / finalWidth;
                    finalWidth = MAX_WIDTH;
                    finalHeight = Math.round(finalHeight * ratio);
                }

                sections.push(new Paragraph({
                    children: [
                        new ImageRun({
                            data: new Uint8Array(imgData.data),
                            transformation: {
                                width: finalWidth,
                                height: finalHeight,
                            },
                            altText: {
                                title: alt,
                                description: alt,
                                name: alt,
                            }
                        }),
                        new TextRun({
                             text: `\n图: ${alt}`,
                             font: font,
                             size: fontSize - 2,
                             color: "666666",
                             italics: true
                        })
                    ],
                    alignment: AlignmentType.CENTER,
                    spacing: { before: 200, after: 200 }
                }));
            } else {
                // Fallback text if image fails
                sections.push(new Paragraph({
                    children: [new TextRun({ text: `[Image: ${alt} - Download Failed]`, color: "FF0000" })],
                    alignment: AlignmentType.CENTER
                }));
            }
        }
        i++;
    }
    // 3. 处理代码块
    else if (line.startsWith('```')) {
      const codeLines = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // 跳过结束符号
      
      sections.push(new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            children: [
              new TableCell({
                children: codeLines.map(cl => new Paragraph({
                  children: [new TextRun({ text: cl, font: "JetBrains Mono", size: 20, color: "334155" })], // Code size usually fixed
                  spacing: { before: 20, after: 20 }
                })),
                shading: { fill: "F8FAFC", type: ShadingType.CLEAR },
                borders: {
                  top: { style: BorderStyle.SINGLE, size: 1, color: "E2E8F0" },
                  bottom: { style: BorderStyle.SINGLE, size: 1, color: "E2E8F0" },
                  left: { style: BorderStyle.SINGLE, size: 6, color: "3B82F6" },
                  right: { style: BorderStyle.SINGLE, size: 1, color: "E2E8F0" },
                },
                margins: { top: 200, bottom: 200, left: 200, right: 200 }
              })
            ]
          })
        ],
      }));
    }
    // 4. 处理表格
    else if (line.startsWith('|')) {
      const tableRows = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        const rawRow = lines[i].trim();
        if (!rawRow.match(/^\|[:\s-]+\|/)) {
          const cells = rawRow.split('|').filter(c => c.trim() !== '' || rawRow.indexOf('|' + c + '|') !== -1).map(c => c.trim());
          if (cells.length > 0) {
            tableRows.push(new TableRow({
              children: cells.map(cell => new TableCell({
                children: [new Paragraph({ children: parseInlineStyles(cell, font, fontSize - 1, style.textColor) as any })],
                borders: {
                  top: { style: BorderStyle.SINGLE, size: 1, color: "94A3B8" },
                  bottom: { style: BorderStyle.SINGLE, size: 1, color: "94A3B8" },
                  left: { style: BorderStyle.SINGLE, size: 1, color: "94A3B8" },
                  right: { style: BorderStyle.SINGLE, size: 1, color: "94A3B8" },
                },
                verticalAlign: VerticalAlign.CENTER,
                margins: { top: 100, bottom: 100, left: 100, right: 100 }
              }))
            }));
          }
        }
        i++;
      }
      sections.push(new Table({
        rows: tableRows,
        width: { size: 100, type: WidthType.PERCENTAGE },
        alignment: AlignmentType.CENTER
      }));
    }
    // 5. 处理块级公式
    else if (line.startsWith('$$')) {
      let formula = line.replace(/\$\$/g, '');
      if (formula === '') {
        i++;
        while (i < lines.length && !lines[i].trim().startsWith('$$')) {
          formula += lines[i] + ' ';
          i++;
        }
      }
      // 使用 DocxMath 和 MathRun，让 Word 识别这是公式区域
      sections.push(new Paragraph({
        children: [
            new DocxMath({
                children: [new MathRun(formula.trim())]
            })
        ],
        alignment: AlignmentType.CENTER,
        spacing: { before: 300, after: 300 }
      }));
      i++;
    }
    // 6. 处理引用
    else if (line.startsWith('>')) {
      sections.push(new Paragraph({
        children: parseInlineStyles(line.replace(/^>\s*/, ''), font, fontSize, "555555") as any,
        indent: { left: 720 },
        spacing: { after: 200 },
        shading: { fill: "F1F5F9", type: ShadingType.CLEAR }
      }));
      i++;
    }
    // 7. 普通段落
    else {
      if (line !== '') {
        sections.push(new Paragraph({
          children: parseInlineStyles(line, font, fontSize, style.textColor) as any,
          alignment: align,
          spacing: { 
              after: style.paragraphSpacing, 
              line: style.lineSpacing * 240, // docx uses 240 for 1 line
              lineRule: "auto"
          }
        }));
      }
      i++;
    }
  }

  const doc = new Document({
    sections: [{
      properties: {
        page: {
          margin: { top: "2.54cm", bottom: "2.54cm", left: "3.18cm", right: "3.18cm" }
        }
      },
      children: sections,
    }],
  });

  const blob = await Packer.toBlob(doc);
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `AI_Doc_${template}_${new Date().getTime()}.docx`;
  a.click();
  window.URL.revokeObjectURL(url);
}
