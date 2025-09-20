import { Parser } from "wouter/router"

class RegexLike {
  #pattern: URLPattern
  #keys: string[]
  #origin = location.origin

  constructor(route: string, keys: string[], loose: boolean) {
    const trimmedRoute = this.#replaceAsterisc(this.#trimTrailingSlash(route)) + (loose? "{/:CATCH_ALL}*" : "")

    this.#pattern = new URLPattern(trimmedRoute, this.#origin, { ignoreCase: true })
    this.#keys = keys
  }

  exec(path: string) {
    const urlPatternResult = this.#pattern.exec(this.#trimTrailingSlash(path), this.#origin)

    if (urlPatternResult === null) return null

    const { CATCH_ALL, ...urlPatternResultRawGroups } = urlPatternResult.pathname.groups
    const urlPatternResultGroups = Object.fromEntries(
      Object.entries(urlPatternResultRawGroups).map(([ key, value ]) => [
        key === "AST"? "*" : key,
        // %2F ( / ) 以外のエンコードされている値を元に戻す
        value === ""? undefined : value?.replace(/(?:%(?!2F).{2})+/g, val => decodeURIComponent(val))
      ])
    )
    const urlPatternResultKeys = Object.keys(urlPatternResultGroups).filter(key => key !== "CATCH_ALL")

    if (this.#keys.length !== 0) this.#keys.length = 0

    for (const urlPatternResultKey of urlPatternResultKeys) {
      this.#keys.push(urlPatternResultKey)
    }

    const matchedPath = (urlPatternResult.inputs[0] as string).replace("/" + CATCH_ALL, "")
    const execResult = [ matchedPath, ...Object.values(urlPatternResultGroups) ]

    Object.assign(execResult, { groups: urlPatternResultGroups })

    return execResult
  }

  #trimTrailingSlash(path: string) {
    if (path === "/") return path

    return path.replace(/\/$/, "")
  }

  // "*" だとマッチ結果に名前付きで表示されない為、
  // 一度ダミーのもので置き換えた後にまた元に戻す
  #replaceAsterisc(path: string) {
    return path.replace(/\/\*\??(?![^/])/, "{/:AST(.*)}?")
  }
}

export const urlPatternParser: Parser = (route: string, loose: boolean = false) => {
  const keys: string[] = [];
  const pattern = new RegexLike(route, keys, loose);

  return { pattern, keys };
};