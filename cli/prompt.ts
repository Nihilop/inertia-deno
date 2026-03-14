/**
 * Utilitaires de prompt interactif minimalistes — zéro dépendance.
 * Lecture depuis stdin, écriture vers stdout.
 */

const enc = new TextEncoder()
const dec = new TextDecoder()

async function readLine(): Promise<string> {
  const buf = new Uint8Array(4096)
  const n = await Deno.stdin.read(buf)
  return dec.decode(buf.subarray(0, n ?? 0)).trim()
}

/**
 * Affiche une question et attend une saisie texte.
 * Si l'utilisateur valide sans saisir, retourne `defaultVal`.
 */
export async function input(question: string, defaultVal = ""): Promise<string> {
  const hint = defaultVal ? ` [${defaultVal}]` : ""
  await Deno.stdout.write(enc.encode(`${question}${hint}: `))
  const answer = await readLine()
  return answer || defaultVal
}

/**
 * Affiche une liste numérotée et retourne la valeur choisie.
 * Par défaut (entrée vide) → premier choix.
 */
export async function select<T extends string>(
  question: string,
  options: { label: string; value: T }[],
): Promise<T> {
  console.log(`\n${question}`)
  for (let i = 0; i < options.length; i++) {
    console.log(`  ${i + 1}. ${options[i].label}`)
  }
  await Deno.stdout.write(enc.encode(`\nChoix [1]: `))
  const answer = await readLine()
  const idx = parseInt(answer, 10) - 1
  if (idx >= 0 && idx < options.length) return options[idx].value
  return options[0].value
}
