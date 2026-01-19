this is how the algorithm works

1. get total paces for year and split them by Q, something like[20, 20, 19, 19]
2. get paces by q by subject, that is, if i have 20 paces for a sibject, that are 5 per Q, for each Q, or 22wouldbe 6, 6, 5, 5

3. get frequencies.if i have 9 weeks, and 5 paces to do, that is 1 pace every 2 weeks, weeks 1, 3, 5, 7, 9. ifmy freq is 3, that is weeks 1, 4, 7

4. order subjects by total pace quantity per Q, and place them in that order with offset
subject 1: offseet 0, start at week 1
subejct 2: offset 1, start at week 2
subject 3: offset 1, start at week 3
subject 4: offseet 0, start at week 1
subejct 5: offset 1, start at week 2
subject 6: offset 1, start at week 3

that should place all subjects
5. find weeks in each Q with 0 or 1 paces, move a pace from the nearest previuos week with 3 or more paces to taht week, without breacking seuqntial order
6. no mroe than 1 pace per subject every week