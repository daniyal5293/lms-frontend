/** Renders <option>s grouped into <optgroup>s, e.g. sections grouped by "Class XI" / "Class XII". */
export function GroupedOptions<T>({
  items,
  groupOf,
  valueOf,
  labelOf,
}: {
  items: T[];
  groupOf: (item: T) => string;
  valueOf: (item: T) => string;
  labelOf: (item: T) => string;
}) {
  const groups = new Map<string, T[]>();
  items.forEach((item) => {
    const group = groupOf(item);
    groups.set(group, [...(groups.get(group) ?? []), item]);
  });

  return (
    <>
      {Array.from(groups.entries()).map(([group, groupItems]) => (
        <optgroup key={group} label={group}>
          {groupItems.map((item) => (
            <option key={valueOf(item)} value={valueOf(item)}>
              {labelOf(item)}
            </option>
          ))}
        </optgroup>
      ))}
    </>
  );
}
