export function resolveSpintax(template: string): string {
  return template.replace(/\{([^}]+)\}/g, (_, options: string) => {
    const choices = options.split('|')
    return choices[Math.floor(Math.random() * choices.length)]
  })
}
