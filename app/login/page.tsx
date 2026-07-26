'use client'
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"
import useConfigStore from "@/store/config"
import { useState } from "react"
import { useRouter } from 'next/navigation';
import { useMount } from "ahooks"
import PasswordInput from "@/components/PasswordInput"

// 用密码换取 httpOnly cookie（中间件与 RSC 的鉴权凭据）
async function setAccessCookie(accessCode: string): Promise<boolean> {
    const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessCode }),
    })
    return res.ok
}

export default function Login() {
    const { setAccessCodePermission } = useConfigStore();
    const [password, setPassword] = useState('')
    const { toast } = useToast();
    const router = useRouter()
    // 迁移 bootstrap：老用户密码仅存在 localStorage，自动换取 cookie 并跳回首页
    useMount(async () => {
        const code = useConfigStore.getState().config.codeConfig.accessCode
        if (!code) return
        const ok = await setAccessCookie(code)
        if (ok) router.push('/')
    })
    const onSubmit = async () => {
        const ok = await setAccessCookie(password ?? '')
        if (!ok) {
            toast({
                variant: "destructive",
                title: "密码错误",
                description: "请检查密码是否正确",
                duration: 1000
            })
            return
        }
        // 保持 localStorage store 同步（editCode 等其它逻辑仍依赖）
        await setAccessCodePermission(password ?? '')
        router.push('/')
    }

    return (
        <Dialog open={true}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>访问密码</DialogTitle>
                    <DialogDescription>
                        需要输入密码才能查看
                    </DialogDescription>
                </DialogHeader>
                <div>
                    <PasswordInput
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </div>
                <DialogFooter>
                    <Button type="submit" className="w-full" onClick={onSubmit}>
                        确定
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
