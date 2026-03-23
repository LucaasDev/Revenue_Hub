
-- Add goal_id column to transactions
ALTER TABLE public.transactions ADD COLUMN goal_id uuid REFERENCES public.goals(id) ON DELETE SET NULL DEFAULT NULL;

-- Replace the update_account_balance trigger function to also handle goal reservations
CREATE OR REPLACE FUNCTION public.update_account_balance()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.status = 'pago' AND NEW.type = 'despesa' THEN
            UPDATE public.accounts SET balance = balance - NEW.amount WHERE id = NEW.account_id;
            -- If this is a goal reservation, add to goal
            IF NEW.goal_id IS NOT NULL THEN
                UPDATE public.goals SET current_amount = current_amount + NEW.amount WHERE id = NEW.goal_id;
            END IF;
        ELSIF NEW.status = 'recebido' AND NEW.type = 'receita' THEN
            UPDATE public.accounts SET balance = balance + NEW.amount WHERE id = NEW.account_id;
        END IF;
        RETURN NEW;
    END IF;
    IF TG_OP = 'UPDATE' THEN
        -- Reverse old effects
        IF OLD.status = 'pago' AND OLD.type = 'despesa' THEN
            UPDATE public.accounts SET balance = balance + OLD.amount WHERE id = OLD.account_id;
            IF OLD.goal_id IS NOT NULL THEN
                UPDATE public.goals SET current_amount = current_amount - OLD.amount WHERE id = OLD.goal_id;
            END IF;
        ELSIF OLD.status = 'recebido' AND OLD.type = 'receita' THEN
            UPDATE public.accounts SET balance = balance - OLD.amount WHERE id = OLD.account_id;
        END IF;
        -- Apply new effects
        IF NEW.status = 'pago' AND NEW.type = 'despesa' THEN
            UPDATE public.accounts SET balance = balance - NEW.amount WHERE id = NEW.account_id;
            IF NEW.goal_id IS NOT NULL THEN
                UPDATE public.goals SET current_amount = current_amount + NEW.amount WHERE id = NEW.goal_id;
            END IF;
        ELSIF NEW.status = 'recebido' AND NEW.type = 'receita' THEN
            UPDATE public.accounts SET balance = balance + NEW.amount WHERE id = NEW.account_id;
        END IF;
        RETURN NEW;
    END IF;
    IF TG_OP = 'DELETE' THEN
        IF OLD.status = 'pago' AND OLD.type = 'despesa' THEN
            UPDATE public.accounts SET balance = balance + OLD.amount WHERE id = OLD.account_id;
            IF OLD.goal_id IS NOT NULL THEN
                UPDATE public.goals SET current_amount = current_amount - OLD.amount WHERE id = OLD.goal_id;
            END IF;
        ELSIF OLD.status = 'recebido' AND OLD.type = 'receita' THEN
            UPDATE public.accounts SET balance = balance - OLD.amount WHERE id = OLD.account_id;
        END IF;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$function$;

-- Create trigger if not exists (drop and recreate to be safe)
DROP TRIGGER IF EXISTS trigger_update_account_balance ON public.transactions;
CREATE TRIGGER trigger_update_account_balance
    AFTER INSERT OR UPDATE OR DELETE ON public.transactions
    FOR EACH ROW EXECUTE FUNCTION public.update_account_balance();
