resource "aws_cloudwatch_log_group" "festival_planner_prod" {
  name              = "/festival-planner/prod"
  retention_in_days = 14

  tags = {
    Name        = "festival-planner-logs"
    Environment = "production"
  }
}
