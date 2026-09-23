arr = list(map(int,input().split()))
mod = 1000000007
res = 1
for i in range(len(arr)):
    res = res * arr[i]

print(res%mod)