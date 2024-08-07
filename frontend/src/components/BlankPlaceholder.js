export function BlankPlaceholder(title, author, updatedAt) {
  return `\\documentclass{article}\n\\usepackage{graphicx} % Required for inserting images\n\n\\title{${title}}\n\\author{${author}}\n\\date{${updatedAt}}\n\n\\begin{document}\n\n\\maketitle\n\n\\section{Introduction}\n\n\\end{document}\n`;
}
