/*
 * ============================================================
 *  Banker's Algorithm - Deadlock Prevention
 *  Core Logic in C
 *  
 *  Input (via stdin, space-separated):
 *    Line 1: num_processes num_resources
 *    Next P lines: Allocation matrix (P x R)
 *    Next P lines: Max matrix (P x R)
 *    Last line: Available resources (R values)
 *
 *  Output (to stdout):
 *    Need matrix, safe sequence or UNSAFE state,
 *    and step-by-step intermediate states.
 * ============================================================
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#define MAX_P 20   /* Maximum processes */
#define MAX_R 20   /* Maximum resource types */

/* ── Global state ── */
int allocation[MAX_P][MAX_R];
int max_mat[MAX_P][MAX_R];
int need[MAX_P][MAX_R];
int available[MAX_R];
int work[MAX_R];
int finish[MAX_P];
int safe_seq[MAX_P];
int num_p, num_r;

/* ── Step log (up to 100 steps, each up to 512 chars) ── */
char step_log[100][512];
int  step_count = 0;

void log_step(const char *msg) {
    if (step_count < 100) {
        strncpy(step_log[step_count], msg, 511);
        step_log[step_count][511] = '\0';
        step_count++;
    }
}

/* Compute Need = Max - Allocation */
void compute_need() {
    for (int i = 0; i < num_p; i++)
        for (int j = 0; j < num_r; j++)
            need[i][j] = max_mat[i][j] - allocation[i][j];
}

/* Check if need[i] <= work */
int can_allocate(int i) {
    for (int j = 0; j < num_r; j++)
        if (need[i][j] > work[j])
            return 0;
    return 1;
}

/* Run the safety algorithm; returns 1 if safe, 0 if unsafe */
int safety_algorithm() {
    /* Initialise work = available, finish = false */
    for (int j = 0; j < num_r; j++) work[j] = available[j];
    memset(finish, 0, sizeof(finish));

    int seq_idx = 0;
    int found;
    char buf[512];

    /* Log initial work vector */
    buf[0] = '\0';
    strcat(buf, "INIT Work = [");
    for (int j = 0; j < num_r; j++) {
        char tmp[20];
        sprintf(tmp, j < num_r-1 ? "%d " : "%d", work[j]);
        strcat(buf, tmp);
    }
    strcat(buf, "]");
    log_step(buf);

    do {
        found = 0;
        for (int i = 0; i < num_p; i++) {
            if (!finish[i] && can_allocate(i)) {
                /* Simulate allocation */
                for (int j = 0; j < num_r; j++)
                    work[j] += allocation[i][j];
                finish[i] = 1;
                safe_seq[seq_idx++] = i;
                found = 1;

                /* Log this step */
                buf[0] = '\0';
                char tmp[256];
                sprintf(tmp, "STEP P%d allocated | Work = [", i);
                strcat(buf, tmp);
                for (int j = 0; j < num_r; j++) {
                    sprintf(tmp, j < num_r-1 ? "%d " : "%d", work[j]);
                    strcat(buf, tmp);
                }
                sprintf(tmp, "] | Need was [");
                strcat(buf, tmp);
                for (int j = 0; j < num_r; j++) {
                    sprintf(tmp, j < num_r-1 ? "%d " : "%d", need[i][j]);
                    strcat(buf, tmp);
                }
                strcat(buf, "]");
                log_step(buf);
            }
        }
    } while (found);

    /* Check if all processes finished */
    for (int i = 0; i < num_p; i++)
        if (!finish[i]) return 0;
    return 1;
}

int main() {
    /* ── Read input ── */
    if (scanf("%d %d", &num_p, &num_r) != 2) {
        printf("ERROR: Could not read num_processes and num_resources\n");
        return 1;
    }

    /* Validate ranges */
    if (num_p <= 0 || num_p > MAX_P || num_r <= 0 || num_r > MAX_R) {
        printf("ERROR: Processes must be 1-%d, Resources must be 1-%d\n", MAX_P, MAX_R);
        return 1;
    }

    /* Allocation matrix */
    for (int i = 0; i < num_p; i++)
        for (int j = 0; j < num_r; j++)
            if (scanf("%d", &allocation[i][j]) != 1) {
                printf("ERROR: Invalid allocation matrix input\n");
                return 1;
            }

    /* Max matrix */
    for (int i = 0; i < num_p; i++)
        for (int j = 0; j < num_r; j++)
            if (scanf("%d", &max_mat[i][j]) != 1) {
                printf("ERROR: Invalid max matrix input\n");
                return 1;
            }

    /* Available vector */
    for (int j = 0; j < num_r; j++)
        if (scanf("%d", &available[j]) != 1) {
            printf("ERROR: Invalid available vector input\n");
            return 1;
        }

    /* ── Validate: allocation <= max ── */
    for (int i = 0; i < num_p; i++)
        for (int j = 0; j < num_r; j++)
            if (allocation[i][j] > max_mat[i][j]) {
                printf("ERROR: Allocation exceeds Max for P%d R%d\n", i, j);
                return 1;
            }

    /* ── Compute Need ── */
    compute_need();

    /* ── Output Need Matrix ── */
    printf("NEED_MATRIX\n");
    for (int i = 0; i < num_p; i++) {
        for (int j = 0; j < num_r; j++) {
            printf("%d", need[i][j]);
            if (j < num_r - 1) printf(" ");
        }
        printf("\n");
    }

    /* ── Run Safety Algorithm ── */
    int safe = safety_algorithm();

    /* ── Output Steps ── */
    printf("STEPS\n");
    printf("%d\n", step_count);
    for (int i = 0; i < step_count; i++)
        printf("%s\n", step_log[i]);

    /* ── Output Result ── */
    if (safe) {
        printf("RESULT SAFE\n");
        printf("SEQUENCE");
        for (int i = 0; i < num_p; i++)
            printf(" P%d", safe_seq[i]);
        printf("\n");
    } else {
        printf("RESULT UNSAFE\n");
        printf("DEADLOCK: System is in an unsafe state. No safe sequence exists.\n");
    }

    return 0;
}
safe sequence optimization applied
