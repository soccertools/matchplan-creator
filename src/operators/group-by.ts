export function groupBy(items: any[], compareFunction: (itemA, itemB) => boolean) {
  const groups = [];

  items.forEach(
    (item) => {
        let matchingGroupIndex;
        if (
          groups.some(
            (group, groupIndex) => {
              const isSameGroup = compareFunction(group[0], item);
              if (isSameGroup) {
                matchingGroupIndex = groupIndex;
              }
              return isSameGroup;
            }
        )
      ) {
          groups[matchingGroupIndex].push(item);
        } else {
          groups.push([item]);
        }
    }
  );

  return groups;
}
