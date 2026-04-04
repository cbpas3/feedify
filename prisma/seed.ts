import { PrismaClient, SourceType, SourceStatus, VisualType } from '../src/generated/prisma'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Clean existing data
  await prisma.feedItem.deleteMany()
  await prisma.contentSource.deleteMany()

  // ─── Seed Source 1: Article about TypeScript ─────────────────────────────

  const source1 = await prisma.contentSource.create({
    data: {
      title: 'TypeScript Best Practices',
      sourceType: SourceType.TEXT,
      rawContent: 'TypeScript is a superset of JavaScript that adds static type checking...',
      status: SourceStatus.DONE,
    },
  })

  await prisma.feedItem.createMany({
    data: [
      {
        contentSourceId: source1.id,
        hook: 'TypeScript catches bugs before they reach production',
        body: 'Static type checking eliminates an entire class of runtime errors. Studies show TypeScript can catch up to 15% of common JavaScript bugs at compile time.',
        visualType: VisualType.STAT,
        visualCode: null,
        orderIndex: 0,
        masteryLevel: 0,
      },
      {
        contentSourceId: source1.id,
        hook: 'Use `unknown` instead of `any` for safer code',
        body: 'Unlike `any`, `unknown` forces you to perform type checks before using a value. This preserves type safety while still handling dynamic data.',
        visualType: VisualType.CODE,
        visualCode: '```typescript\n// ❌ Unsafe\nfunction parse(data: any) { return data.name }\n\n// ✅ Safe\nfunction parse(data: unknown) {\n  if (typeof data === "object" && data !== null && "name" in data) {\n    return (data as { name: string }).name\n  }\n}\n```',
        orderIndex: 1,
        masteryLevel: 2,
      },
      {
        contentSourceId: source1.id,
        hook: 'Prefer interface over type for object shapes',
        body: 'Interfaces are extendable and produce clearer error messages. Use `type` for unions, intersections, and primitives. Use `interface` for objects you might extend.',
        visualType: VisualType.TIP,
        visualCode: null,
        orderIndex: 2,
        masteryLevel: 1,
      },
    ],
  })

  // ─── Seed Source 2: React performance tips ────────────────────────────────

  const source2 = await prisma.contentSource.create({
    data: {
      title: 'React Performance Patterns',
      sourceType: SourceType.TEXT,
      rawContent: 'React renders can be expensive. Understanding when and why components re-render...',
      status: SourceStatus.DONE,
    },
  })

  await prisma.feedItem.createMany({
    data: [
      {
        contentSourceId: source2.id,
        hook: 'Every context value change re-renders ALL consumers',
        body: 'Splitting your context into smaller, focused contexts prevents unnecessary re-renders. A single global context is an anti-pattern in large apps.',
        visualType: VisualType.QUOTE,
        visualCode: null,
        orderIndex: 0,
        masteryLevel: 0,
      },
      {
        contentSourceId: source2.id,
        hook: '`useMemo` is not free — measure before you add it',
        body: 'Memoization adds overhead: memory allocation, comparison logic, and code complexity. Profile first. Only memoize computations that take >1ms or cause measurable render slowdowns.',
        visualType: VisualType.TIP,
        visualCode: null,
        orderIndex: 1,
        masteryLevel: 3,
      },
      {
        contentSourceId: source2.id,
        hook: 'Virtualize lists with >100 items for smooth scrolling',
        body: 'Rendering 1000 DOM nodes upfront tanks performance. Libraries like TanStack Virtual render only visible rows, keeping the DOM lean regardless of data size.',
        visualType: VisualType.STAT,
        visualCode: null,
        orderIndex: 2,
        masteryLevel: 0,
      },
    ],
  })

  console.log(`✓ Created 2 content sources and 6 feed items`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
