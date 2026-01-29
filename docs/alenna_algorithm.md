# Alenna Projection Algorithm

## Overview

The Alenna Projection Algorithm generates a deterministic 36-week pace distribution schedule for students. It ensures balanced workload distribution across quarters while maintaining sequential pace order and respecting subject pairing constraints.

## Constraints

- **Minimum total paces**: 72 paces per year
- **Maximum paces per subject**: 36 paces per subject
- **Weeks per quarter**: 9 weeks
- **Total weeks**: 36 weeks (4 quarters)
- **Maximum subjects per week**: 3 subjects (excluding electives)
- **Electives**: Multiple electives can be placed together in the same week
- **Sequential order**: Paces within each subject must be placed in sequential order (e.g., 1001 before 1002)

## Algorithm Modes

### MODE A: Uniform Curriculum (Difficulty Pairing)

**Applies when:**
- Total paces === 72
- All subjects have identical pace counts
- More than 1 subject

**Strategy:**
1. Sort subjects by difficulty (descending)
2. Pair hardest with easiest subjects
3. Rotate pairs across weeks
4. Handle unpaired subjects (if odd number of subjects)

**Guarantees:**
- Perfect quarter balance (18 paces per quarter)
- Difficulty-balanced workload
- No forbidden pairings

### MODE B: Non-uniform Curriculum (Frequency-based)

**Applies when:**
- Total paces > 72 OR
- Subjects have different pace counts OR
- Single subject

**Strategy:**
1. Calculate total paces and distribute across 4 quarters
2. Calculate paces per quarter for each subject
3. Calculate weekly frequency for each subject per quarter
4. Sort subjects by pace count per quarter (descending)
5. Assign offsets (0, 1, 2) cycling for subjects
6. Place paces using frequency-based placement with offsets
7. Redistribute paces to balance sparse weeks

## Detailed Steps

### Step 1: Calculate Total Paces and Quarter Distribution

Split total paces across 4 quarters as evenly as possible:
- Example: 78 paces → [20, 20, 19, 19]
- Example: 72 paces → [18, 18, 18, 18]

### Step 2: Calculate Paces per Quarter per Subject

For each subject, distribute its paces across 4 quarters:
- Example: 20 paces → [5, 5, 5, 5]
- Example: 22 paces → [6, 6, 5, 5]

### Step 3: Calculate Weekly Frequencies

For each subject per quarter, calculate how often a pace should be placed:
- Formula: `frequency = round(9 weeks / paces in quarter)`
- Example: 5 paces in 9 weeks → frequency = 2 (weeks 1, 3, 5, 7, 9)
- Example: 3 paces in 9 weeks → frequency = 3 (weeks 1, 4, 7)

**Special case**: Subjects with 28-36 total paces use frequency = 1 (one pace per week)

### Step 4: Assign Offsets and Place Subjects

**For subjects with >3 paces per quarter:**
- Sort subjects by pace count per quarter (descending)
- Assign offsets cycling: 0, 1, 2, 0, 1, 2...
- Subject 1: offset 0, starts at week 1
- Subject 2: offset 1, starts at week 2
- Subject 3: offset 2, starts at week 3
- Subject 4: offset 0, starts at week 1 (cycle repeats)

**For subjects with ≤3 paces per quarter:**
- Continue offset cycle from subjects with >3 paces
- Calculate starting offset: `subjectsWithMoreThan3Paces.length % 3`
- Assign offsets: `(startingOffset + index) % 3`

**Special case**: Subjects with 28-36 total paces always use offset 0

### Step 5: Place Paces with Frequency and Offset

For each subject in each quarter:
1. **First pace prioritization**: For the first pace of each subject, prioritize weeks 1 and 2 to ensure they have 2 paces each
2. **Calculate target week**: `weekIndex = offset + (paceIndex * frequency)`
3. **Fallback strategy** (if week exceeds quarter bounds):
   - Attempt 1: Reduce frequency by 1
   - Attempt 2: Reduce offset by 1
   - Last resort: Use offset 0, frequency 1, start at paceIndex
4. **Sequential order check**: Ensure pace is placed after all earlier paces from the same subject
5. **Constraint checks**: Verify week has space, subject not already in week, and notPairWith constraints

### Step 6: Redistribution

After initial placement, balance weeks:
- Find weeks with 0-1 paces (sparse weeks)
- Find weeks with 3+ paces (dense weeks)
- Move paces from dense weeks to sparse weeks while maintaining:
  - Sequential order within subject
  - Maximum 3 subjects per week
  - notPairWith constraints

## Key Features

### Sequential Order Enforcement

Paces within each subject must be placed in sequential order:
- Pace 1001 must come before 1002
- Pace 1002 must come before 1003
- Within each quarter, earlier paces must be in earlier weeks

### Week 1 and 2 Prioritization

The first pace of each subject is prioritized for weeks 1 and 2 to ensure:
- Week 1 has 2 paces from different subjects
- Week 2 has 2 paces from different subjects

### Constraint Relaxation

When total paces > 72:
- notPairWith constraints are relaxed to ensure all paces can be placed
- Difficulty constraints are relaxed
- Sequential order is still maintained

### Electives Handling

- Electives can be placed together in the same week
- Subjects within elective categories are treated as unique categories
- Multiple electives can share a week even if it exceeds the normal subject limit

## Output

The algorithm returns an array of `GeneratedProjectionPace` objects, each containing:
- `categoryId`: The subject category ID
- `subjectId`: The subject ID
- `paceCode`: The pace code (e.g., "1001")
- `quarter`: Quarter number (1-4)
- `week`: Week number within quarter (1-9)

## Determinism

The algorithm is **fully deterministic**: given the same input, it will always produce the same output. This ensures consistent projections for students.