import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { toast } from "~/components/ui/toast";
import type { ConnectionBody } from "~/utils/interface";
import { useForm, Controller } from 'react-hook-form';
import { establishConnection } from "~/utils/api";
import { useState } from "react";
import { Spinner } from "~/components/ui/spinner";
import { useNavigate } from 'react-router';

export default function DatabaseConnectionPage() {
  const [ isLoading, setIsLoading ] = useState(false);
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors }, control } = useForm<ConnectionBody>({
    defaultValues: {
      type: 'mysql'
    }
  });

  const submitHandler = async (body: ConnectionBody) => {
    setIsLoading(true);
    try {
      const response = await establishConnection(body);

      if(response.success) {
        toast.add({
          title: 'Connection established successfully',
          type: 'success',
          timeout: 3000
        });
        setTimeout(() => {
          navigate('/conversation', {
            state: {
              connectionId: response.data.connectionId
            }
          });
        }, 500);
      }
    } catch (err: any) {
      toast.add({
        title: 'An application error has occurred',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-6">
      <div className="w-full max-w-md rounded-xl border bg-background p-6 shadow-sm">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold">Database Connection</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Enter your database connection details.
          </p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit(submitHandler)}>
          {/* Database Type */}
          <div className="space-y-2">
            <Controller
              name="type"
              control={control}
              rules={{ required: true }}
              render={({ field }) => (
                <>
                  <Label htmlFor="database-type">Database Type</Label>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select database type" />
                    </SelectTrigger>

                    <SelectContent>
                      <SelectItem value="mysql">MySQL</SelectItem>
                    </SelectContent>
                  </Select>
                </>
              )}
            />
          </div>

          {/* Host */}
          <div className="space-y-2">
            <Label htmlFor="host">Host</Label>
            <Input
              id="host"
              placeholder="localhost"
              {...register('host',{ required: true }) }
            />
          </div>

          {/* Port */}
          <div className="space-y-2">
            <Label htmlFor="port">Port</Label>
            <Input
              id="port"
              type="number"
              placeholder="3306"
              {...register('port', { required: true }) }
            />
          </div>

          {/* Username */}
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              placeholder="root"
              {...register('username', { required: true }) }
            />
          </div>

          {/* Password */}
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter password"
              {...register('password', { required: true }) }
            />
          </div>

          {/* Database */}
          <div className="space-y-2">
            <Label htmlFor="database">Database</Label>
            <Input
              id="database"
              placeholder="my_database"
              {...register('database', { required: true }) }
            />
          </div>

          {/* Submit */}
          <Button type="submit" className="w-full">
            { isLoading && <Spinner /> }
            Connect
          </Button>
        </form>
      </div>
    </div>
  );
}
