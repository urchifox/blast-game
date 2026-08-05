export type UnionToIntersection<U> = (
	U extends unknown ? (arg: U) => void : never
) extends (arg: infer I) => void
	? I
	: never

export type FirstConstructorArg<
	T extends abstract new (...args: never) => unknown,
> = ConstructorParameters<T>[0]
