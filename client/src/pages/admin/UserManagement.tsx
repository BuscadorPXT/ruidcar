import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AdminLayout from "@/components/admin/AdminLayout";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  User,
  Lock,
  Trash2,
  Eye,
  Building2,
  Link,
  Unlink,
  RefreshCw,
  Users,
  Wrench,
  Shield,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface UserRole {
  roleId: number;
  roleName: string;
  organizationId: number | null;
}

interface Workshop {
  id: number;
  workshopId?: number;
  workshopName?: string;
  name: string;
  cnpj?: string;
  status: string | boolean;
  createdAt?: string;
}

interface User {
  id: number;
  email: string;
  username: string;
  name: string;
  company: string | null;
  userType?: string;
  createdAt: string;
  roles: UserRole[];
  workshops: Workshop[];
}

export default function UserManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [resetPasswordDialog, setResetPasswordDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
    queryFn: async () => {
      const res = await fetch("/api/admin/users", {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch users");
      return res.json();
    },
  });

  // Separar usuários por tipo
  const usersByType = useMemo(() => {
    if (!users) return { admins: [], workshopOwners: [], clients: [], others: [] };

    const admins: User[] = [];
    const workshopOwners: User[] = [];
    const clients: User[] = [];
    const others: User[] = [];

    users.forEach((user) => {
      const primaryRole = user.roles[0]?.roleName;

      if (user.roles.some(r => r.roleName === 'ADMIN')) {
        admins.push(user);
      } else if (user.roles.some(r => r.roleName === 'OFICINA_OWNER') || user.userType === 'workshop_admin') {
        workshopOwners.push(user);
      } else if (user.roles.some(r => r.roleName === 'CLIENTE')) {
        clients.push(user);
      } else {
        others.push(user);
      }
    });

    return { admins, workshopOwners, clients, others };
  }, [users]);

  // Filtrar usuários baseado na busca e tab ativa
  const getFilteredUsers = (userList: User[]) => {
    if (!searchTerm) return userList;

    const searchLower = searchTerm.toLowerCase();
    return userList.filter((user) => {
      const workshopNames = user.workshops
        .map(w => (w.workshopName || w.name || '').toLowerCase())
        .join(' ');

      return (
        user.email.toLowerCase().includes(searchLower) ||
        user.name.toLowerCase().includes(searchLower) ||
        (user.username && user.username.toLowerCase().includes(searchLower)) ||
        workshopNames.includes(searchLower)
      );
    });
  };

  const resetPasswordMutation = useMutation({
    mutationFn: async ({ userId, newPassword }: { userId: number | string; newPassword: string }) => {
      const res = await fetch(`/api/admin/users/${userId}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ newPassword }),
      });
      if (!res.ok) throw new Error("Failed to reset password");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Senha redefinida com sucesso" });
      setResetPasswordDialog(false);
      setNewPassword("");
      setSelectedUser(null);
    },
    onError: () => {
      toast({
        title: "Erro ao redefinir senha",
        variant: "destructive",
      });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: number | string) => {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to delete user");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Usuário excluído com sucesso" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setDeleteDialog(false);
      setSelectedUser(null);
    },
    onError: (error: Error) => {
      toast({
        title: error.message || "Erro ao excluir usuário",
        variant: "destructive",
      });
    },
  });

  const unlinkWorkshopMutation = useMutation({
    mutationFn: async ({ userId, workshopId }: { userId: number | string; workshopId: number }) => {
      const res = await fetch(`/api/admin/users/${userId}/workshops/${workshopId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to unlink workshop");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Oficina desvinculada com sucesso" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    },
    onError: () => {
      toast({
        title: "Erro ao desvincular oficina",
        variant: "destructive",
      });
    },
  });

  const getRoleBadgeColor = (roleName: string) => {
    switch (roleName) {
      case "ADMIN":
        return "destructive";
      case "OFICINA_OWNER":
        return "secondary";
      case "CLIENTE":
        return "default";
      case "workshop_admin":
      case "workshop_manager":
        return "secondary";
      default:
        return "outline";
    }
  };

  const getUserIcon = (user: User) => {
    if (user.roles.some(r => r.roleName === 'ADMIN')) {
      return <Shield className="h-4 w-4 text-red-500" />;
    }
    if (user.roles.some(r => r.roleName === 'OFICINA_OWNER') || user.userType === 'workshop_admin') {
      return <Wrench className="h-4 w-4 text-blue-500" />;
    }
    if (user.roles.some(r => r.roleName === 'CLIENTE')) {
      return <User className="h-4 w-4 text-green-500" />;
    }
    return <User className="h-4 w-4 text-gray-500" />;
  };

  const UserTable = ({ userList }: { userList: User[] }) => {
    const filteredList = getFilteredUsers(userList);

    if (filteredList.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          Nenhum usuário encontrado
        </div>
      );
    }

    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Usuário</TableHead>
              <TableHead>Oficina Vinculada</TableHead>
              <TableHead>Funções</TableHead>
              <TableHead>Empresa</TableHead>
              <TableHead>Cadastro</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredList.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <div className="flex items-start gap-2">
                    {getUserIcon(user)}
                    <div>
                      <div className="font-medium">
                        {user.name}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {user.email}
                      </div>
                      {user.username && (
                        <div className="text-xs text-muted-foreground">
                          @{user.username}
                        </div>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  {user.workshops.length > 0 ? (
                    <div className="space-y-1">
                      {user.workshops.map((workshop, idx) => (
                        <div key={workshop.workshopId || workshop.id || idx} className="flex items-center gap-2">
                          <Building2 className="h-3 w-3 text-muted-foreground" />
                          <div>
                            <span className="text-sm font-medium">
                              {workshop.workshopName || workshop.name}
                            </span>
                            {typeof workshop.status === 'boolean' ? (
                              <Badge
                                variant={workshop.status ? "default" : "secondary"}
                                className={cn(
                                  "ml-2 text-xs",
                                  workshop.status && "bg-green-500 hover:bg-green-600"
                                )}
                              >
                                {workshop.status ? "Ativa" : "Pendente"}
                              </Badge>
                            ) : workshop.status && (
                              <Badge
                                variant="outline"
                                className="ml-2 text-xs"
                              >
                                {workshop.status}
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-sm">
                      Sem oficina
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex gap-1 flex-wrap">
                    {user.roles.map((role, idx) => (
                      <Badge
                        key={idx}
                        variant={getRoleBadgeColor(role.roleName)}
                      >
                        {role.roleName === 'OFICINA_OWNER' ? 'DONO' :
                         role.roleName === 'CLIENTE' ? 'CLIENTE' :
                         role.roleName}
                      </Badge>
                    ))}
                    {user.userType === 'workshop_admin' && !user.roles.some(r => r.roleName === 'OFICINA_OWNER') && (
                      <Badge variant="secondary">
                        ADMIN OFICINA
                      </Badge>
                    )}
                    {user.roles.length === 0 && user.userType !== 'workshop_admin' && (
                      <Badge variant="outline">Sem função</Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm text-muted-foreground">
                    {user.company || '-'}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm text-muted-foreground">
                    {format(new Date(user.createdAt), "dd/MM/yyyy", {
                      locale: ptBR,
                    })}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => setSelectedUser(user)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Detalhes do Usuário</DialogTitle>
                          <DialogDescription>
                            Informações completas sobre o usuário
                          </DialogDescription>
                        </DialogHeader>
                        {selectedUser && (
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label>Nome</Label>
                                <p className="font-medium">
                                  {selectedUser.name}
                                </p>
                              </div>
                              <div>
                                <Label>Email</Label>
                                <p className="font-medium">{selectedUser.email}</p>
                              </div>
                              <div>
                                <Label>Username</Label>
                                <p className="font-medium">@{selectedUser.username}</p>
                              </div>
                              <div>
                                <Label>Data de Cadastro</Label>
                                <p className="font-medium">
                                  {format(
                                    new Date(selectedUser.createdAt),
                                    "dd/MM/yyyy HH:mm",
                                    { locale: ptBR }
                                  )}
                                </p>
                              </div>
                            </div>

                            <div>
                              <Label>Funções</Label>
                              <div className="flex gap-2 mt-2">
                                {selectedUser.roles.map((role, idx) => (
                                  <Badge
                                    key={idx}
                                    variant={getRoleBadgeColor(role.roleName)}
                                  >
                                    {role.roleName}
                                  </Badge>
                                ))}
                                {selectedUser.roles.length === 0 && (
                                  <Badge variant="outline">Sem função</Badge>
                                )}
                              </div>
                            </div>

                            {selectedUser.workshops.length > 0 && (
                              <div>
                                <Label>Oficinas Vinculadas</Label>
                                <div className="space-y-2 mt-2">
                                  {selectedUser.workshops.map((workshop) => (
                                    <Card key={workshop.id}>
                                      <CardContent className="flex justify-between items-center p-3">
                                        <div>
                                          <p className="font-medium">
                                            {workshop.name}
                                          </p>
                                          {workshop.cnpj && (
                                            <p className="text-sm text-muted-foreground">
                                              Código: {workshop.cnpj}
                                            </p>
                                          )}
                                          <div className="flex gap-2 mt-1">
                                            <Badge variant="outline">
                                              {typeof workshop.status === 'boolean'
                                                ? (workshop.status ? 'Ativa' : 'Pendente')
                                                : workshop.status}
                                            </Badge>
                                          </div>
                                        </div>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => {
                                            unlinkWorkshopMutation.mutate({
                                              userId: selectedUser.id,
                                              workshopId: workshop.id,
                                            });
                                          }}
                                        >
                                          <Unlink className="h-4 w-4 mr-2" />
                                          Desvincular
                                        </Button>
                                      </CardContent>
                                    </Card>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>

                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        setSelectedUser(user);
                        setResetPasswordDialog(true);
                      }}
                    >
                      <Lock className="h-4 w-4" />
                    </Button>

                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        setSelectedUser(user);
                        setDeleteDialog(true);
                      }}
                      disabled={user.roles.some((r) => r.roleName === "ADMIN")}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  const allUsers = users || [];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Gerenciamento de Usuários</h1>
            <p className="text-muted-foreground">
              Gerencie todos os usuários do sistema
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total de Usuários
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{allUsers.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Donos de Oficina
              </CardTitle>
              <Wrench className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{usersByType.workshopOwners.length}</div>
              <p className="text-xs text-muted-foreground">
                Com oficinas ativas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Clientes
              </CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{usersByType.clients.length}</div>
              <p className="text-xs text-muted-foreground">
                Usuários finais
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Administradores
              </CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{usersByType.admins.length}</div>
              <p className="text-xs text-muted-foreground">
                Acesso total
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Usuários do Sistema</CardTitle>
            <CardDescription>
              Visualize e gerencie usuários por categoria
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <Input
                placeholder="Buscar por nome, email ou oficina..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>

            <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="all">
                  Todos ({allUsers.length})
                </TabsTrigger>
                <TabsTrigger value="workshop-owners">
                  Donos de Oficina ({usersByType.workshopOwners.length})
                </TabsTrigger>
                <TabsTrigger value="clients">
                  Clientes ({usersByType.clients.length})
                </TabsTrigger>
                <TabsTrigger value="admins">
                  Administradores ({usersByType.admins.length})
                </TabsTrigger>
                <TabsTrigger value="others">
                  Outros ({usersByType.others.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="all">
                <UserTable userList={allUsers} />
              </TabsContent>

              <TabsContent value="workshop-owners">
                <UserTable userList={usersByType.workshopOwners} />
              </TabsContent>

              <TabsContent value="clients">
                <UserTable userList={usersByType.clients} />
              </TabsContent>

              <TabsContent value="admins">
                <UserTable userList={usersByType.admins} />
              </TabsContent>

              <TabsContent value="others">
                <UserTable userList={usersByType.others} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Reset Password Dialog */}
        <Dialog open={resetPasswordDialog} onOpenChange={setResetPasswordDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Redefinir Senha</DialogTitle>
              <DialogDescription>
                Digite uma nova senha para o usuário {selectedUser?.email}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="new-password">Nova Senha</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo de 6 caracteres"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setResetPasswordDialog(false);
                  setNewPassword("");
                }}
              >
                Cancelar
              </Button>
              <Button
                onClick={() => {
                  if (selectedUser && newPassword) {
                    resetPasswordMutation.mutate({
                      userId: selectedUser.id,
                      newPassword,
                    });
                  }
                }}
                disabled={!newPassword || newPassword.length < 6}
              >
                Redefinir Senha
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialog} onOpenChange={setDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir o usuário {selectedUser?.email}?
                Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  if (selectedUser) {
                    deleteUserMutation.mutate(selectedUser.id);
                  }
                }}
              >
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
}